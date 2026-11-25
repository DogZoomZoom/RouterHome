//go:build windows

package main

import (
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	user32   = windows.NewLazySystemDLL("user32.dll")
	gdi32    = windows.NewLazySystemDLL("gdi32.dll")
	shell32  = windows.NewLazySystemDLL("shell32.dll")
	advapi32 = windows.NewLazySystemDLL("advapi32.dll")
	dwmapi   = windows.NewLazySystemDLL("dwmapi.dll")
	kernel32 = windows.NewLazySystemDLL("kernel32.dll")

	pRegisterClassExW       = user32.NewProc("RegisterClassExW")
	pCreateWindowExW        = user32.NewProc("CreateWindowExW")
	pDefWindowProcW         = user32.NewProc("DefWindowProcW")
	pShowWindow             = user32.NewProc("ShowWindow")
	pGetMessageW            = user32.NewProc("GetMessageW")
	pTranslateMessage       = user32.NewProc("TranslateMessage")
	pDispatchMessageW       = user32.NewProc("DispatchMessageW")
	pPostMessageW           = user32.NewProc("PostMessageW")
	pPostQuitMessage        = user32.NewProc("PostQuitMessage")
	pDestroyWindow          = user32.NewProc("DestroyWindow")
	pMoveWindow             = user32.NewProc("MoveWindow")
	pSetWindowPos           = user32.NewProc("SetWindowPos")
	pGetClientRect          = user32.NewProc("GetClientRect")
	pGetWindowRect          = user32.NewProc("GetWindowRect")
	pInvalidateRect         = user32.NewProc("InvalidateRect")
	pBeginPaint             = user32.NewProc("BeginPaint")
	pEndPaint               = user32.NewProc("EndPaint")
	pLoadCursorW            = user32.NewProc("LoadCursorW")
	pSetCursor              = user32.NewProc("SetCursor")
	pLoadImageW             = user32.NewProc("LoadImageW")
	pDestroyIcon            = user32.NewProc("DestroyIcon")
	pMessageBoxW            = user32.NewProc("MessageBoxW")
	pSetWindowTextW         = user32.NewProc("SetWindowTextW")
	pGetKeyState            = user32.NewProc("GetKeyState")
	pCreatePopupMenu        = user32.NewProc("CreatePopupMenu")
	pAppendMenuW            = user32.NewProc("AppendMenuW")
	pTrackPopupMenu         = user32.NewProc("TrackPopupMenu")
	pDestroyMenu            = user32.NewProc("DestroyMenu")
	pSetMenuDefaultItem     = user32.NewProc("SetMenuDefaultItem")
	pSetForegroundWindow    = user32.NewProc("SetForegroundWindow")
	pGetCursorPos           = user32.NewProc("GetCursorPos")
	pFindWindowW            = user32.NewProc("FindWindowW")
	pIsWindowVisible        = user32.NewProc("IsWindowVisible")
	pIsIconic               = user32.NewProc("IsIconic")
	pIsZoomed               = user32.NewProc("IsZoomed")
	pGetDpiForWindow        = user32.NewProc("GetDpiForWindow")
	pTrackMouseEvent        = user32.NewProc("TrackMouseEvent")
	pRegisterWindowMessageW = user32.NewProc("RegisterWindowMessageW")
	pFillRect               = user32.NewProc("FillRect")
	pDrawTextW              = user32.NewProc("DrawTextW")
	pDrawIconEx             = user32.NewProc("DrawIconEx")
	pGetSystemMetrics       = user32.NewProc("GetSystemMetrics")
	pSetFocus               = user32.NewProc("SetFocus")
	pScreenToClient         = user32.NewProc("ScreenToClient")
	pSendMessageW           = user32.NewProc("SendMessageW")
	pGetWindowPlacement     = user32.NewProc("GetWindowPlacement")

	pCreateSolidBrush       = gdi32.NewProc("CreateSolidBrush")
	pDeleteObject           = gdi32.NewProc("DeleteObject")
	pSelectObject           = gdi32.NewProc("SelectObject")
	pCreateFontW            = gdi32.NewProc("CreateFontW")
	pSetBkMode              = gdi32.NewProc("SetBkMode")
	pSetTextColor           = gdi32.NewProc("SetTextColor")
	pCreateCompatibleDC     = gdi32.NewProc("CreateCompatibleDC")
	pCreateCompatibleBitmap = gdi32.NewProc("CreateCompatibleBitmap")
	pBitBlt                 = gdi32.NewProc("BitBlt")
	pDeleteDC               = gdi32.NewProc("DeleteDC")
	pRoundRect              = gdi32.NewProc("RoundRect")
	pEllipse                = gdi32.NewProc("Ellipse")
	pGetStockObject         = gdi32.NewProc("GetStockObject")
	pGetTextExtentPoint32W  = gdi32.NewProc("GetTextExtentPoint32W")

	pShellNotifyIconW = shell32.NewProc("Shell_NotifyIconW")
	pShellExecuteW    = shell32.NewProc("ShellExecuteW")

	pCredWriteW  = advapi32.NewProc("CredWriteW")
	pCredReadW   = advapi32.NewProc("CredReadW")
	pCredDeleteW = advapi32.NewProc("CredDeleteW")
	pCredFree    = advapi32.NewProc("CredFree")

	pDwmSetWindowAttribute = dwmapi.NewProc("DwmSetWindowAttribute")
	pGetModuleHandleW      = kernel32.NewProc("GetModuleHandleW")
)

const (
	WS_OVERLAPPEDWINDOW = 0x00CF0000
	WS_CHILD            = 0x40000000
	WS_VISIBLE          = 0x10000000
	WS_CLIPCHILDREN     = 0x02000000
	WS_CLIPSIBLINGS     = 0x04000000
	CW_USEDEFAULT       = 0x80000000

	SW_HIDE       = 0
	SW_SHOW       = 5
	SW_RESTORE    = 9
	SW_MAXIMIZE   = 3
	SW_SHOWNORMAL = 1

	WM_CREATE        = 0x0001
	WM_DESTROY       = 0x0002
	WM_MOVE          = 0x0003
	WM_SIZE          = 0x0005
	WM_SETFOCUS      = 0x0007
	WM_PAINT         = 0x000F
	WM_CLOSE         = 0x0010
	WM_ERASEBKGND    = 0x0014
	WM_SETTINGCHANGE = 0x001A
	WM_SETCURSOR     = 0x0020
	WM_GETMINMAXINFO = 0x0024
	WM_NULL          = 0x0000
	WM_KEYDOWN       = 0x0100
	WM_SYSKEYDOWN    = 0x0104
	WM_COMMAND       = 0x0111
	WM_MOUSEMOVE     = 0x0200
	WM_LBUTTONDOWN   = 0x0201
	WM_LBUTTONUP     = 0x0202
	WM_LBUTTONDBLCLK = 0x0203
	WM_RBUTTONUP     = 0x0205
	WM_MOUSELEAVE    = 0x02A3
	WM_DPICHANGED    = 0x02E0
	WM_CONTEXTMENU   = 0x007B
	WM_APP           = 0x8000

	WM_APP_RUN  = WM_APP + 1
	WM_APP_SHOW = WM_APP + 2
	WM_APP_TRAY = WM_APP + 3

	NIN_BALLOONUSERCLICK = 0x0405

	CS_HREDRAW = 0x0002
	CS_VREDRAW = 0x0001
	CS_DBLCLKS = 0x0008

	IDC_ARROW = 32512
	IDC_HAND  = 32649

	IMAGE_ICON      = 1
	LR_DEFAULTCOLOR = 0

	MB_OK              = 0x0
	MB_YESNO           = 0x4
	MB_ICONERROR       = 0x10
	MB_ICONQUESTION    = 0x20
	MB_ICONWARNING     = 0x30
	MB_ICONINFORMATION = 0x40
	MB_DEFBUTTON2      = 0x100
	MB_SETFOREGROUND   = 0x10000
	IDYES              = 6

	MF_STRING    = 0x0
	MF_SEPARATOR = 0x800
	MF_CHECKED   = 0x8
	MF_GRAYED    = 0x1

	TPM_RIGHTBUTTON = 0x0002
	TPM_RETURNCMD   = 0x0100
	TPM_BOTTOMALIGN = 0x0020

	NIM_ADD    = 0
	NIM_MODIFY = 1
	NIM_DELETE = 2

	NIF_MESSAGE = 0x01
	NIF_ICON    = 0x02
	NIF_TIP     = 0x04
	NIF_INFO    = 0x10

	NIIF_INFO       = 0x1
	NIIF_WARNING    = 0x2
	NIIF_ERROR      = 0x3
	NIIF_USER       = 0x4
	NIIF_LARGE_ICON = 0x20

	VK_TAB     = 0x09
	VK_SHIFT   = 0x10
	VK_CONTROL = 0x11
	VK_F5      = 0x74

	TRANSPARENT = 1
	SRCCOPY     = 0x00CC0020
	NULL_PEN    = 8

	DT_LEFT         = 0x0
	DT_CENTER       = 0x1
	DT_VCENTER      = 0x4
	DT_SINGLELINE   = 0x20
	DT_NOPREFIX     = 0x800
	DT_END_ELLIPSIS = 0x8000

	TME_LEAVE = 0x2

	SWP_NOZORDER   = 0x0004
	SWP_NOACTIVATE = 0x0010

	SM_CXSMICON = 49
	SM_CYSMICON = 50
)

type POINT struct{ X, Y int32 }
type RECT struct{ Left, Top, Right, Bottom int32 }

type MSG struct {
	Hwnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      POINT
	_       uint32
}

type WNDCLASSEXW struct {
	CbSize        uint32
	Style         uint32
	LpfnWndProc   uintptr
	CbClsExtra    int32
	CbWndExtra    int32
	HInstance     uintptr
	HIcon         uintptr
	HCursor       uintptr
	HbrBackground uintptr
	LpszMenuName  *uint16
	LpszClassName *uint16
	HIconSm       uintptr
}

type PAINTSTRUCT struct {
	Hdc         uintptr
	FErase      int32
	RcPaint     RECT
	FRestore    int32
	FIncUpdate  int32
	RgbReserved [32]byte
}

type NOTIFYICONDATAW struct {
	CbSize           uint32
	HWnd             uintptr
	UID              uint32
	UFlags           uint32
	UCallbackMessage uint32
	HIcon            uintptr
	SzTip            [128]uint16
	DwState          uint32
	DwStateMask      uint32
	SzInfo           [256]uint16
	UVersion         uint32
	SzInfoTitle      [64]uint16
	DwInfoFlags      uint32
	GuidItem         windows.GUID
	HBalloonIcon     uintptr
}

type TRACKMOUSEEVENT struct {
	CbSize      uint32
	DwFlags     uint32
	HwndTrack   uintptr
	DwHoverTime uint32
}

type MINMAXINFO struct {
	PtReserved     POINT
	PtMaxSize      POINT
	PtMaxPosition  POINT
	PtMinTrackSize POINT
	PtMaxTrackSize POINT
}

type WINDOWPLACEMENT struct {
	Length           uint32
	Flags            uint32
	ShowCmd          uint32
	PtMinPosition    POINT
	PtMaxPosition    POINT
	RcNormalPosition RECT
}

func u16(s string) *uint16 {
	p, _ := windows.UTF16PtrFromString(s)
	return p
}

func copyU16(dst []uint16, s string) {
	src, _ := windows.UTF16FromString(s)
	if len(src) > len(dst) {
		src = src[:len(dst)]
		src[len(src)-1] = 0
	}
	copy(dst, src)
}

func loword(v uintptr) int32 { return int32(int16(v & 0xffff)) }
func hiword(v uintptr) int32 { return int32(int16((v >> 16) & 0xffff)) }

func rgb(r, g, b uint8) uintptr { return uintptr(r) | uintptr(g)<<8 | uintptr(b)<<16 }

func messageBox(hwnd uintptr, text, title string, flags uintptr) int {
	r, _, _ := pMessageBoxW.Call(hwnd, uintptr(unsafe.Pointer(u16(text))), uintptr(unsafe.Pointer(u16(title))), flags)
	return int(r)
}

func shellOpen(url string) {
	pShellExecuteW.Call(0, uintptr(unsafe.Pointer(u16("open"))), uintptr(unsafe.Pointer(u16(url))), 0, 0, SW_SHOWNORMAL)
}

func keyDown(vk uintptr) bool {
	r, _, _ := pGetKeyState.Call(vk)
	return int16(r) < 0
}

func moduleHandle() uintptr {
	h, _, _ := pGetModuleHandleW.Call(0)
	return h
}

func loadIcon(id int, size int) uintptr {
	h, _, _ := pLoadImageW.Call(moduleHandle(), uintptr(id), IMAGE_ICON, uintptr(size), uintptr(size), LR_DEFAULTCOLOR)
	return h
}

func dpiOf(hwnd uintptr) int {
	if pGetDpiForWindow.Find() == nil {
		if r, _, _ := pGetDpiForWindow.Call(hwnd); r != 0 {
			return int(r)
		}
	}
	return 96
}

func newCallback(fn interface{}) uintptr { return syscall.NewCallback(fn) }
