// cbcheck: verifies every function passed to a Windows callback constructor
// satisfies Go's syscall.NewCallback rules on amd64.
package main

import (
	"fmt"
	"go/ast"
	"go/build"
	"go/importer"
	"go/parser"
	"go/token"
	"go/types"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	ctx := build.Default
	ctx.GOOS, ctx.GOARCH, ctx.CgoEnabled = "windows", "amd64", false
	sizes := types.SizesFor("gc", "amd64")
	bad, checked := 0, 0
	for _, dir := range os.Args[1:] {
		bp, err := ctx.ImportDir(dir, 0)
		if err != nil {
			fmt.Println("skip", dir, err)
			continue
		}
		fset := token.NewFileSet()
		var files []*ast.File
		for _, f := range bp.GoFiles {
			af, err := parser.ParseFile(fset, filepath.Join(dir, f), nil, 0)
			if err != nil {
				panic(err)
			}
			files = append(files, af)
		}
		conf := types.Config{Importer: importer.ForCompiler(fset, "source", nil), Sizes: sizes, Error: func(error) {}}
		build.Default = ctx
		info := &types.Info{Uses: map[*ast.Ident]types.Object{}, Types: map[ast.Expr]types.TypeAndValue{}}
		conf.Check(bp.ImportPath, fset, files, info)
		for _, f := range files {
			ast.Inspect(f, func(n ast.Node) bool {
				call, ok := n.(*ast.CallExpr)
				if !ok || len(call.Args) != 1 {
					return true
				}
				var name string
				switch fn := call.Fun.(type) {
				case *ast.Ident:
					name = fn.Name
				case *ast.SelectorExpr:
					name = fn.Sel.Name
				}
				if name != "NewComProc" && name != "NewCallback" && name != "newCallback" {
					return true
				}
				tv, ok := info.Types[call.Args[0]]
				if !ok {
					return true
				}
				sig, ok := tv.Type.Underlying().(*types.Signature)
				if !ok {
					return true
				}
				checked++
				pos := fset.Position(call.Pos())
				var problems []string
				for i := 0; i < sig.Params().Len(); i++ {
					t := sig.Params().At(i).Type()
					if sizes.Sizeof(t) > 8 {
						problems = append(problems, fmt.Sprintf("param %d %s is %d bytes", i, t, sizes.Sizeof(t)))
					}
					if b, ok := t.Underlying().(*types.Basic); ok && b.Info()&types.IsFloat != 0 {
						problems = append(problems, fmt.Sprintf("param %d %s is float", i, t))
					}
				}
				if sig.Results().Len() != 1 || sizes.Sizeof(sig.Results().At(0).Type()) != 8 {
					problems = append(problems, "result must be one uintptr-sized value")
				}
				if len(problems) > 0 {
					bad++
					fmt.Printf("BAD %s:%d %s\n", strings.TrimPrefix(pos.Filename, "/home/claude/homehub/"), pos.Line, strings.Join(problems, "; "))
				}
				return true
			})
		}
	}
	fmt.Printf("checked %d callbacks, %d bad\n", checked, bad)
	if bad > 0 {
		os.Exit(1)
	}
}
