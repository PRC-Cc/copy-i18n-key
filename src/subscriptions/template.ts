export const header = `<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>翻译配置</title>
    <style>
        body {
            font-size: 16px;
            margin: 10px;
            max-width: 700px;
        }

        .hide {
            display: none !important;
        }

        .btn {
            outline: none;
            position: relative;
            display: inline-flex;
            align-items: center;
            font-weight: 400;
            white-space: nowrap;
            text-align: center;
            background-image: none;
            background-color: transparent;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all .2s cubic-bezier(.645, .045, .355, 1);
            user-select: none;
            touch-action: manipulation;
            line-height: 1.5714285714285714;
            color: #fff;
            background-color: #4096ff;
            font-size: 14px;
            padding: 4px 15px;
            border-radius: 6px;

        }

        .btn svg {
            margin-left: 4px;
        }

        .btn:hover {
            color: #fff;
            background-color: #4096ff;
        }

        .btn:active {
            color: #fff;
            background-color: #0958d9;
        }

        input {
            box-sizing: border-box;
            margin: 0;
            padding: 4px 11px;
            color: rgba(0, 0, 0, .88);
            font-size: 14px;
            line-height: 1.5714285714285714;
            list-style: none;
            font-family: -apple-system, BlinkMacSystemFont, segoe ui, Roboto, helvetica neue, Arial, noto sans, sans-serif, apple color emoji, segoe ui emoji, segoe ui symbol, noto color emoji;
            position: relative;
            display: inline-block;
            width: 100%;
            min-width: 0;
            background-color: #fff;
            background-image: none;
            border-width: 1px;
            border-style: solid;
            border-color: #d9d9d9;
            border-radius: 6px;
            transition: all .2s;
        }

        input:hover {
            border-color: #4096ff;
            border-inline-end-width: 1px;
        }

        input:focus {
            border-color: #4096ff;
            box-shadow: 0 0 0 2px rgba(5, 145, 255, .1);
            border-inline-end-width: 1px;
            outline: 0;
        }

        .row {
            display: flex;
            align-items: center;
        }

        .row:not(:first-child) {
            margin-top: 10px;
        }


        .header {
            display: flex;
            align-items: center;
        }

        .header .btn {
            margin-left: 20px;
        }


        .row .content {
            flex: 1;
            margin: 0 20px;
        }

        .content-box {
            margin: 20px 0;
        }

        .tip {
            font-size: 14px;
        }

        .animation-loading {
            display: none;
            -webkit-animation: loadingCircle 1s infinite linear;
            animation: loadingCircle 1s infinite linear;
        }

        @-webkit-keyframes loadingCircle {
            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
            }
        }

        @keyframes loadingCircle {
            100% {
                -webkit-transform: rotate(360deg);
                transform: rotate(360deg);
            }
        }

        .tip-box {
            position: fixed;
            top: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            width: 100%;
            align-items: center;
            pointer-events: none;
        }

        .tip-box .tip {
            transition: opacity ease 0.5s;
            margin-top: 20px;
            display: inline-block;
            padding: 9px 12px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 6px 16px 0 rgba(0, 0, 0, .08), 0 3px 6px -4px rgba(0, 0, 0, .12), 0 9px 28px 8px rgba(0, 0, 0, .05);
            pointer-events: none;
            opacity: 0;
            color: black;
        }

        .opacity-full {
            opacity: 1 !important;
        }
        .btn.translate.loading .animation-loading {
            display: inline-block;
        }
    </style>
</head>

<body>
`;

export const contentGenerator = (isBdTranslateEnable: boolean) => {
  return `
    <div class="header">
        key：<input class="inp-key" placeholder="请输入 key" />
        <div class="btn" onclick="refresh()">刷新</div>
    </div>
    <div class="content-box">
        <div class="row">
            <div class="title">中</div>
            <div class="content">
                <input class="inp-val-zh_CN" placeholder="请输入值" />
            </div>
            <div class="action">
                <div class="btn translate ${isBdTranslateEnable ? "" : "hide"}" onclick="transform()">
                            翻译
                            <svg class="animation-loading" viewBox="0 0 1024 1024" focusable="false" data-icon="loading"
                                width="1em" height="1em" fill="currentColor" aria-hidden="true">
                                <path
                                    d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z">
                                </path>
                            </svg>
                </div>
                <div class="btn" onclick='insert("zh_CN")'>填入</div>
            </div>
        </div>
        <div class="row">
            <div class="title">英</div>
            <div class="content">
                <input class="inp-val-en" placeholder="请输入值" />
            </div>
            <div class="action">
                <div class="btn" onclick='insert("en")'>填入</div>
            </div>
        </div>
        <div class="row">
            <div class="title">繁</div>
            <div class="content">
                <input class="inp-val-zh_TW" placeholder="请输入值" />
            </div>
            <div class="action">
                <div class="btn" onclick='insert("zh_TW")'>填入</div>
            </div>
        </div>
    </div>
    <p class="tip">注：</p>
    <p class="tip">1. 填写key、值后，方可填入；</p>
    <p class="tip">2. 配置国际化翻译插件后，点击刷新按钮生效</p>
    <div class="tip-box"></div>`;
};

export const myScript = `<script>
const $ = function (selector) {
    return document.querySelector(selector)
}
const vscode = acquireVsCodeApi();
const typeMap = {
    'en': '英',
    'zh_CN': '中',
    'zh_TW': '繁'
}

function showTip(text) {
    const currentTipEle = $('.tip-box .tip')
    if (currentTipEle) {
        currentTipEle.remove()
    }
    const tipEle = document.createElement('div')
    tipEle.className = 'tip'
    tipEle.innerText = text
    $('.tip-box').appendChild(tipEle)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            tipEle.className = 'tip opacity-full'
        })
    })
    setTimeout(() => {
        tipEle.className = 'tip'
    }, 2e3);
}
function insert(type) {
    const keyEle = $('.inp-key')
    if (!keyEle || !keyEle.value) {
        showTip('请输入 key')
        return;
    }
    const valEle = $(".inp-val-" + type)
    if (!valEle || !valEle.value) {
        showTip("请输入" + typeMap[type] + "的值")
        return;
    }

    vscode.postMessage({
        command: 'insert',
        data: {
            type,
            key: keyEle.value,
            value: valEle.value
        }
    })
}

function refresh() {
    const key = $('.inp-key').value;
    const value = {}
    for (let key in typeMap) {
        const ele = $(".inp-val-" + key);
        if (ele && ele.value) {
            value[key] = ele.value
        }
    }

    vscode.postMessage({
        command: 'refresh',
        data: {
            key,
            value
        }
    })
}

function transform() {
    const ele = $('.btn.translate')
    if (ele.className.includes('loading')) {
        return;
    }
    const value = $('.inp-val-zh_CN').value
    if (!value) {
        showTip('请输入中')
        return;
    }
    ele.className += ' loading'
    vscode.postMessage({
        command: 'translate',
        data: value
    })
}

window.addEventListener('message', event => {

    const message = event.data;

    switch (message.command) {
        case 'changeTranslateStatus':
            const tEle = $('.btn.translate');
            const classList = [...tEle.classList]
            if (message.data) {
                if (classList.includes('hide')) {
                    tEle.className = classList.filter(i => i !== 'hide').join(' ')
                }
            } else {
                if (!classList.includes('hide')) {
                    tEle.className = [...classList, 'hide'].join(' ')
                }
            }
            break;
        case 'translate':
            for (let key in message.data) {
                const val = message.data[key]
                if (val) {
                    $(".inp-val-" + key).value = (val).toString()
                    const ele = $('.btn.translate')
                    const newClassName = [...ele.classList].filter(i => i !== 'loading').join(' ')
                    ele.className = newClassName;
                }
            }
            break;
    }
});
</script>`;

export const footer = `
</body>
</html>
`;
