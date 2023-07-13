import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/blackboard.css';
import 'codemirror/theme/xq-light.css';
import 'codemirror/theme/xq-dark.css';
import 'codemirror/theme/rubyblue.css';
import 'codemirror/mode/clike/clike'
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);

    const ctemp = `#include <stdio.h>

int main()
{
    printf("Hello World");

    return 0;
}`
    const cpptemp = `#include <bits/stdc++.h>

using namespace std;

int main()
{
    cout<<"Hello World";

    return 0;
}`

    const javatemp = `public class Main
{
	public static void main(String[] args) {
		System.out.println("Hello World");
	}
}`
    const pythontemp = `print ('Hello World')`;

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'text/x-csrc', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    tabSize: 2,
                    lineNumbers: true,
                }

            );
            editorRef.current.setValue("//Please select a language to load template.");
            let option = document.getElementById("specificSizeSelect");
            let val = "default";
            option.addEventListener("change", (e) => {
                if (window.confirm("Changing language will result a new template")) {

                    if (option.value === "C") {
                        editorRef.current.setOption("mode", "text/x-csrc");
                        editorRef.current.setValue(ctemp);
                        val = "C";
                    }

                    else if (option.value === "Cpp") {
                        editorRef.current.setOption("mode", "text/x-c++src");
                        editorRef.current.setValue(cpptemp);
                        val = "Cpp";
                    }

                    else if (option.value === "Java") {
                        editorRef.current.setOption("mode", "text/x-java");
                        editorRef.current.setValue(javatemp);
                        val = "Java";
                    }

                    else if (option.value === "Python") {
                        editorRef.current.setOption("mode", "text/x-python");
                        editorRef.current.setValue(pythontemp);
                        val = "Python";
                    }
                }
                else {
                    e.target.value = val;
                }
            })
            const theme = document.getElementById("specificThemeSelect");
            theme.addEventListener("change", () => {
                if (theme.value === "1")
                    editorRef.current.setOption("theme", "blackboard");

                else if (theme.value === "2")
                    editorRef.current.setOption("theme", "xq-light");

                else if (theme.value === "3")
                    editorRef.current.setOption("theme", "xq-dark");

                else if (theme.value === "4")
                    editorRef.current.setOption("theme", "rubyblue");
            })
            let input = document.getElementById("input");
            let output = document.getElementById("output");
            let run = document.getElementById("run");
            run.addEventListener("click", async function () {
                let code = {
                    code: editorRef.current.getValue(),
                    input: input.value,
                    lang: option.value
                }
                console.log(JSON.stringify(code));
                const outData = await fetch("https://code-fusion-ani.onrender.com/compile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(code)
                })
                let d = await outData.json();
                console.log(d);
                output.value = d.output;
            })
            const bars = document.getElementById("bars");
            const aside = document.getElementById("aside");
            bars.addEventListener("click", () => {
                if (aside.style.display === "none")
                    aside.style.display = "block";
                else
                    aside.style.display = "none";
            })
            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code);
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        }
        init();
    }, []);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef.current]);


    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
