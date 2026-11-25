package main

// Unix crypt(3) implementations used by GL.iNet's login challenge:
// $1$ (MD5-crypt), $5$ (SHA-256-crypt) and $6$ (SHA-512-crypt).

import (
	"crypto/md5"
	"crypto/sha256"
	"crypto/sha512"
	"errors"
	"hash"
	"strconv"
	"strings"
)

const cryptB64 = "./0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

func b64From24(b2, b1, b0 byte, n int, out *strings.Builder) {
	w := uint(b2)<<16 | uint(b1)<<8 | uint(b0)
	for ; n > 0; n-- {
		out.WriteByte(cryptB64[w&0x3f])
		w >>= 6
	}
}

// Crypt hashes password with a salt spec such as "$5$salt$" or "$6$rounds=5000$salt".
func Crypt(password, setting string) (string, error) {
	switch {
	case strings.HasPrefix(setting, "$1$"):
		return md5Crypt(password, setting), nil
	case strings.HasPrefix(setting, "$5$"):
		return shaCrypt(password, setting, "$5$", sha256.New, 32), nil
	case strings.HasPrefix(setting, "$6$"):
		return shaCrypt(password, setting, "$6$", sha512.New, 64), nil
	}
	return "", errors.New("Unsupported password hash scheme: " + setting)
}

func shaCrypt(password, setting, prefix string, newHash func() hash.Hash, size int) string {
	rest := setting[len(prefix):]
	rounds, customRounds := 5000, false
	if strings.HasPrefix(rest, "rounds=") {
		if i := strings.IndexByte(rest, '$'); i > 0 {
			if n, err := strconv.Atoi(rest[7:i]); err == nil {
				if n < 1000 {
					n = 1000
				}
				if n > 999999999 {
					n = 999999999
				}
				rounds, customRounds = n, true
				rest = rest[i+1:]
			}
		}
	}
	salt := rest
	if i := strings.IndexByte(salt, '$'); i >= 0 {
		salt = salt[:i]
	}
	if len(salt) > 16 {
		salt = salt[:16]
	}
	pw, sl := []byte(password), []byte(salt)

	b := newHash()
	b.Write(pw)
	b.Write(sl)
	b.Write(pw)
	B := b.Sum(nil)

	a := newHash()
	a.Write(pw)
	a.Write(sl)
	for i := len(pw); i > 0; i -= size {
		if i > size {
			a.Write(B)
		} else {
			a.Write(B[:i])
		}
	}
	for i := len(pw); i > 0; i >>= 1 {
		if i&1 != 0 {
			a.Write(B)
		} else {
			a.Write(pw)
		}
	}
	A := a.Sum(nil)

	dp := newHash()
	for range pw {
		dp.Write(pw)
	}
	DP := dp.Sum(nil)
	P := make([]byte, 0, len(pw))
	for i := len(pw); i > 0; i -= size {
		if i > size {
			P = append(P, DP...)
		} else {
			P = append(P, DP[:i]...)
		}
	}

	ds := newHash()
	for i := 0; i < 16+int(A[0]); i++ {
		ds.Write(sl)
	}
	DS := ds.Sum(nil)
	Sb := make([]byte, 0, len(sl))
	for i := len(sl); i > 0; i -= size {
		if i > size {
			Sb = append(Sb, DS...)
		} else {
			Sb = append(Sb, DS[:i]...)
		}
	}

	C := A
	for r := 0; r < rounds; r++ {
		c := newHash()
		if r&1 != 0 {
			c.Write(P)
		} else {
			c.Write(C)
		}
		if r%3 != 0 {
			c.Write(Sb)
		}
		if r%7 != 0 {
			c.Write(P)
		}
		if r&1 != 0 {
			c.Write(C)
		} else {
			c.Write(P)
		}
		C = c.Sum(nil)
	}

	var out strings.Builder
	out.WriteString(prefix)
	if customRounds {
		out.WriteString("rounds=" + strconv.Itoa(rounds) + "$")
	}
	out.WriteString(salt)
	out.WriteByte('$')
	if size == 32 {
		order := [][3]int{{0, 10, 20}, {21, 1, 11}, {12, 22, 2}, {3, 13, 23}, {24, 4, 14},
			{15, 25, 5}, {6, 16, 26}, {27, 7, 17}, {18, 28, 8}, {9, 19, 29}}
		for _, o := range order {
			b64From24(C[o[0]], C[o[1]], C[o[2]], 4, &out)
		}
		b64From24(0, C[31], C[30], 3, &out)
	} else {
		order := [][3]int{{0, 21, 42}, {22, 43, 1}, {44, 2, 23}, {3, 24, 45}, {25, 46, 4},
			{47, 5, 26}, {6, 27, 48}, {28, 49, 7}, {50, 8, 29}, {9, 30, 51}, {31, 52, 10},
			{53, 11, 32}, {12, 33, 54}, {34, 55, 13}, {56, 14, 35}, {15, 36, 57}, {37, 58, 16},
			{59, 17, 38}, {18, 39, 60}, {40, 61, 19}, {62, 20, 41}}
		for _, o := range order {
			b64From24(C[o[0]], C[o[1]], C[o[2]], 4, &out)
		}
		b64From24(0, 0, C[63], 2, &out)
	}
	return out.String()
}

func md5Crypt(password, setting string) string {
	salt := setting[3:]
	if i := strings.IndexByte(salt, '$'); i >= 0 {
		salt = salt[:i]
	}
	if len(salt) > 8 {
		salt = salt[:8]
	}
	pw, sl := []byte(password), []byte(salt)

	alt := md5.New()
	alt.Write(pw)
	alt.Write(sl)
	alt.Write(pw)
	final := alt.Sum(nil)

	ctx := md5.New()
	ctx.Write(pw)
	ctx.Write([]byte("$1$"))
	ctx.Write(sl)
	for i := len(pw); i > 0; i -= 16 {
		if i > 16 {
			ctx.Write(final)
		} else {
			ctx.Write(final[:i])
		}
	}
	for i := len(pw); i > 0; i >>= 1 {
		if i&1 != 0 {
			ctx.Write([]byte{0})
		} else {
			ctx.Write(pw[:1])
		}
	}
	final = ctx.Sum(nil)

	for i := 0; i < 1000; i++ {
		c := md5.New()
		if i&1 != 0 {
			c.Write(pw)
		} else {
			c.Write(final)
		}
		if i%3 != 0 {
			c.Write(sl)
		}
		if i%7 != 0 {
			c.Write(pw)
		}
		if i&1 != 0 {
			c.Write(final)
		} else {
			c.Write(pw)
		}
		final = c.Sum(nil)
	}

	var out strings.Builder
	out.WriteString("$1$" + salt + "$")
	b64From24(final[0], final[6], final[12], 4, &out)
	b64From24(final[1], final[7], final[13], 4, &out)
	b64From24(final[2], final[8], final[14], 4, &out)
	b64From24(final[3], final[9], final[15], 4, &out)
	b64From24(final[4], final[10], final[5], 4, &out)
	b64From24(0, 0, final[11], 2, &out)
	return out.String()
}

// cryptSelfTest checks the implementation against the published test vectors.
func cryptSelfTest() error {
	vectors := [][3]string{
		{"Hello world!", "$5$saltstring", "$5$saltstring$5B8vYYiY.CVt1RlTTf8KbXBH3hsxY/GNooZaBBGWEc5"},
		{"Hello world!", "$5$rounds=10000$saltstringsaltstring", "$5$rounds=10000$saltstringsaltst$3xv.VbSHBb41AL9AvLeujZkZRBAwqFMz2.opqey6IcA"},
		{"Hello world!", "$6$saltstring", "$6$saltstring$svn8UoSVapNtMuq1ukKS4tPQd8iKwSMHWjl/O817G3uBnIFNjnQJuesI68u4OTLiBFdcbYEdFCoEOfaS35inz1"},
		{"password", "$1$saltsalt", "$1$saltsalt$qjXMvbEw8oaL.CzflDtaK/"},
	}
	for _, v := range vectors {
		got, err := Crypt(v[0], v[1])
		if err != nil {
			return err
		}
		if got != v[2] {
			return errors.New("crypt self-test failed for " + v[1] + ": got " + got)
		}
	}
	return nil
}
