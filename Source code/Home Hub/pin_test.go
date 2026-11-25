package main

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestPin(t *testing.T) {
	var p PinState
	for _, bad := range []string{"", "123", "123456789", "12a4", " 1234"} {
		if p.Set(bad) == nil {
			t.Fatalf("PIN %q should be rejected", bad)
		}
	}
	if err := p.Set("4821"); err != nil {
		t.Fatal(err)
	}
	if strings.Contains(p.Hash, "4821") || len(p.Hash) != 64 {
		t.Fatal("hash looks wrong")
	}
	now := time.Unix(1_800_000_000, 0)
	if ok, _ := p.Check("4821", now); !ok {
		t.Fatal("right PIN rejected")
	}
	// survives a save/load round trip
	data, _ := json.Marshal(p)
	var q PinState
	_ = json.Unmarshal(data, &q)
	if ok, _ := q.Check("4821", now); !ok {
		t.Fatal("right PIN rejected after reload")
	}
	// four free wrong guesses, then delays that double
	for i := 1; i < freeTries; i++ {
		if ok, w := q.Check("0000", now); ok || w != 0 {
			t.Fatalf("guess %d: ok=%v wait=%v", i, ok, w)
		}
	}
	if ok, w := q.Check("0000", now); ok || w != 30*time.Second {
		t.Fatalf("5th wrong guess should start a 30s wait, got %v", w)
	}
	if ok, w := q.Check("4821", now.Add(10*time.Second)); ok || w != 20*time.Second {
		t.Fatalf("even the right PIN must wait, got ok=%v wait=%v", ok, w)
	}
	if ok, w := q.Check("0000", now.Add(31*time.Second)); ok || w != 60*time.Second {
		t.Fatalf("6th wrong guess should wait 60s, got %v", w)
	}
	// the wait is persisted
	data, _ = json.Marshal(q)
	var r PinState
	_ = json.Unmarshal(data, &r)
	if r.Wait(now.Add(40*time.Second)) == 0 {
		t.Fatal("wait should survive a restart")
	}
	if ok, _ := r.Check("4821", now.Add(200*time.Second)); !ok || r.Failures != 0 {
		t.Fatal("right PIN after the wait should unlock and reset failures")
	}
	for i := 0; i < 40; i++ {
		r.Check("0000", now.Add(time.Duration(i)*time.Hour))
	}
	if w := r.Wait(now.Add(39 * time.Hour)); w > maxDelay {
		t.Fatalf("delay must be capped, got %v", w)
	}
}
