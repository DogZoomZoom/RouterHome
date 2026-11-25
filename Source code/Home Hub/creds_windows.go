//go:build windows

package main

import (
	"errors"
	"strconv"
	"unicode/utf16"
	"unsafe"

	"golang.org/x/sys/windows"
)

// Windows Credential Manager store, compatible with Router Home's entries
// ("RouterHome:<host>"), so an existing saved router login keeps working.

type credentialW struct {
	Flags              uint32
	Type               uint32
	TargetName         *uint16
	Comment            *uint16
	LastWritten        windows.Filetime
	CredentialBlobSize uint32
	CredentialBlob     *byte
	Persist            uint32
	AttributeCount     uint32
	Attributes         uintptr
	TargetAlias        *uint16
	UserName           *uint16
}

const (
	credTypeGeneric         = 1
	credPersistLocalMachine = 2
)

type winCreds struct{}

func credTarget(host string) string { return "RouterHome:" + host }

func (winCreds) Save(host, user, password string) error {
	u := utf16.Encode([]rune(password))
	blob := make([]byte, len(u)*2)
	for i, v := range u {
		blob[2*i] = byte(v)
		blob[2*i+1] = byte(v >> 8)
	}
	c := credentialW{
		Type:               credTypeGeneric,
		TargetName:         u16(credTarget(host)),
		Comment:            u16("Router Home login"),
		CredentialBlobSize: uint32(len(blob)),
		Persist:            credPersistLocalMachine,
		UserName:           u16(user),
	}
	if len(blob) > 0 {
		c.CredentialBlob = &blob[0]
	}
	r, _, e := pCredWriteW.Call(uintptr(unsafe.Pointer(&c)), 0)
	for i := range blob {
		blob[i] = 0
	}
	if r == 0 {
		code := uintptr(0)
		if en, ok := e.(windows.Errno); ok {
			code = uintptr(en)
		}
		return errors.New("Could not save to Windows Credential Manager (error " + strconv.Itoa(int(code)) + ")")
	}
	return nil
}

func (winCreds) Load(host string) (string, string, bool) {
	var p *credentialW
	r, _, _ := pCredReadW.Call(uintptr(unsafe.Pointer(u16(credTarget(host)))), credTypeGeneric, 0, uintptr(unsafe.Pointer(&p)))
	if r == 0 || p == nil {
		return "", "", false
	}
	defer pCredFree.Call(uintptr(unsafe.Pointer(p)))
	pw := ""
	if p.CredentialBlobSize > 0 && p.CredentialBlob != nil {
		n := int(p.CredentialBlobSize / 2)
		w := unsafe.Slice((*uint16)(unsafe.Pointer(p.CredentialBlob)), n)
		pw = string(utf16.Decode(w))
	}
	user := ""
	if p.UserName != nil {
		user = windows.UTF16PtrToString(p.UserName)
	}
	return user, pw, pw != ""
}

func (winCreds) Delete(host string) {
	pCredDeleteW.Call(uintptr(unsafe.Pointer(u16(credTarget(host)))), credTypeGeneric, 0)
}

// fixedCreds stores one login under a fixed name, ignoring the host. Used for
// the Flint 3, whose IP address can change.
type fixedCreds struct{ name string }

func (f fixedCreds) Save(_, user, password string) error {
	return winCreds{}.Save(f.name, user, password)
}
func (f fixedCreds) Load(_ string) (string, string, bool) { return winCreds{}.Load(f.name) }
func (f fixedCreds) Delete(_ string)                      { winCreds{}.Delete(f.name) }
