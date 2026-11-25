"""Router Home release signing (2026-11-22). Ed25519 (RFC 8032 reference algorithm, pure Python, no extra modules),
written in OpenWrt usign's file formats so routers verify releases with:  usign -V -m <file> -p release.pub -x <file>.sig

  python tools/rh_sign.py genkey               -> private/release-signing.key (SECRET, never upload) + prints release.pub
  python tools/rh_sign.py pubkey               -> prints the public key file (usign format)
  python tools/rh_sign.py sign <file>          -> writes <file>.sig
  python tools/rh_sign.py verify <file>        -> checks <file>.sig with the public key (sanity check on the PC)
  python tools/rh_sign.py verifypub <file> <sig> <release.pub>  -> checks like a router does (no secret key needed)

The secret key file holds the 32-byte Ed25519 seed and the 8-byte key fingerprint usign uses to match key and signature.
"""
import base64, hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYFILE = os.path.join(ROOT, "private", "release-signing.key")

p = 2 ** 255 - 19
q = 2 ** 252 + 27742317777372353535851937790883648493
def _inv(x): return pow(x, p - 2, p)
d = -121665 * _inv(121666) % p
def _sha512(b): return hashlib.sha512(b).digest()
def _add(P, Q):
    A = (P[1] - P[0]) * (Q[1] - Q[0]) % p; B = (P[1] + P[0]) * (Q[1] + Q[0]) % p
    C = 2 * P[3] * Q[3] * d % p; D = 2 * P[2] * Q[2] % p
    E, F, G, H = B - A, D - C, D + C, B + A
    return (E * F % p, G * H % p, F * G % p, E * H % p)
def _mul(s, P):
    Q = (0, 1, 1, 0)
    while s > 0:
        if s & 1: Q = _add(Q, P)
        P = _add(P, P); s >>= 1
    return Q
def _eq(P, Q):
    return (P[0] * Q[2] - Q[0] * P[2]) % p == 0 and (P[1] * Q[2] - Q[1] * P[2]) % p == 0
def _recover_x(y, sign):
    if y >= p: return None
    x2 = (y * y - 1) * _inv(d * y * y + 1)
    if x2 == 0: return None if sign else 0
    x = pow(x2, (p + 3) // 8, p)
    if (x * x - x2) % p != 0: x = x * pow(2, (p - 1) // 4, p) % p
    if (x * x - x2) % p != 0: return None
    if (x & 1) != sign: x = p - x
    return x
_gy = 4 * _inv(5) % p; _gx = _recover_x(_gy, 0); G = (_gx, _gy, 1, _gx * _gy % p)
def _compress(P):
    zi = _inv(P[2]); x = P[0] * zi % p; y = P[1] * zi % p
    return int.to_bytes(y | ((x & 1) << 255), 32, "little")
def _decompress(s):
    y = int.from_bytes(s, "little"); sign = y >> 255; y &= (1 << 255) - 1
    x = _recover_x(y, sign)
    return None if x is None else (x, y, 1, x * y % p)
def _expand(seed):
    h = _sha512(seed); a = int.from_bytes(h[:32], "little"); a &= (1 << 254) - 8; a |= 1 << 254
    return a, h[32:]
def public_key(seed): return _compress(_mul(_expand(seed)[0], G))
def sign(seed, msg):
    a, prefix = _expand(seed); A = _compress(_mul(a, G))
    r = int.from_bytes(_sha512(prefix + msg), "little") % q
    R = _compress(_mul(r, G))
    h = int.from_bytes(_sha512(R + A + msg), "little") % q
    return R + int.to_bytes((r + h * a) % q, 32, "little")
def verify(pub, msg, sig):
    A = _decompress(pub); R = _decompress(sig[:32]); s = int.from_bytes(sig[32:], "little")
    if A is None or R is None or s >= q: return False
    h = int.from_bytes(_sha512(sig[:32] + pub + msg), "little") % q
    return _eq(_mul(s, G), _add(R, _mul(h, A)))

def _load():
    with open(KEYFILE) as f: k = json.load(f)
    return bytes.fromhex(k["seed"]), bytes.fromhex(k["fp"])
def pubfile(seed, fp):
    return "untrusted comment: Router Home release key\n" + base64.b64encode(b"Ed" + fp + public_key(seed)).decode() + "\n"

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "genkey":
        if os.path.exists(KEYFILE): sys.exit("a key already exists: " + KEYFILE + " (delete it on purpose to make a new one)")
        seed, fp = os.urandom(32), os.urandom(8)
        os.makedirs(os.path.dirname(KEYFILE), exist_ok=True)
        with open(KEYFILE, "w") as f: json.dump({"seed": seed.hex(), "fp": fp.hex(), "note": "Router Home release signing key. SECRET: never upload or share."}, f)
        print(pubfile(seed, fp), end="")
    elif cmd == "pubkey":
        seed, fp = _load()
        if len(sys.argv) > 2:   # write the file directly (LF line endings; PowerShell redirects mangle it)
            with open(sys.argv[2], "w", newline="\n") as f: f.write(pubfile(seed, fp))
            print("wrote " + sys.argv[2])
        else: print(pubfile(seed, fp), end="")
    elif cmd == "sign":
        seed, fp = _load(); path = sys.argv[2]
        with open(path, "rb") as f: data = f.read()
        sig = sign(seed, data)
        with open(path + ".sig", "w", newline="\n") as f:
            f.write("untrusted comment: signed by Router Home release key\n" + base64.b64encode(b"Ed" + fp + sig).decode() + "\n")
        print("signed " + os.path.basename(path))
    elif cmd == "verify":
        seed, fp = _load(); path = sys.argv[2]
        with open(path, "rb") as f: data = f.read()
        with open(path + ".sig") as f: raw = base64.b64decode(f.read().splitlines()[1])
        ok = raw[:2] == b"Ed" and raw[2:10] == fp and verify(public_key(seed), data, raw[10:])
        print("signature OK" if ok else "SIGNATURE BAD"); sys.exit(0 if ok else 1)
    elif cmd == "verifypub":
        # like a router does it: <file> <sigfile> <release.pub>, no secret key needed (tools/check-release.ps1)
        path, sigp, pubp = sys.argv[2], sys.argv[3], sys.argv[4]
        with open(path, "rb") as f: data = f.read()
        with open(sigp) as f: raw = base64.b64decode(f.read().splitlines()[1])
        with open(pubp) as f: pk = base64.b64decode(f.read().splitlines()[1])
        ok = raw[:2] == b"Ed" and pk[:2] == b"Ed" and raw[2:10] == pk[2:10] and verify(pk[10:], data, raw[10:])
        print("signature OK" if ok else "SIGNATURE BAD"); sys.exit(0 if ok else 1)
    else:
        sys.exit(__doc__)
