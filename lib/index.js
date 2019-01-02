"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = __importDefault(require("puppeteer"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const colors_1 = __importDefault(require("colors"));
const ora_1 = __importDefault(require("ora"));
init();
const keyWord = '复仇者联盟';
const table = new cli_table3_1.default({
    head: ['Name', 'Size', 'Time', 'BT'],
    style: {
        head: [],
        border: [],
    },
    colWidths: [60, 12, 10, 70],
});
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        // 要一个搞事的浏览器
        const browser = yield puppeteer_1.default.launch({
            defaultViewport: {
                width: 1080,
                height: 1920,
            }
        });
        // 打开一个页面
        const page = yield browser.newPage();
        yield page.goto('http://www.zhizhud.com/');
        console.log('输入关键字中...');
        // 搜索关键字，设置点延时来模拟用户输入
        yield page.type('#search', keyWord, { delay: 100 });
        const spinner = ora_1.default('输入完成~~, 准备跳转新页面').start();
        yield Promise.all([
            page.waitForNavigation(),
            page.click('#btnSearch'),
        ]);
        spinner.succeed();
        spinner.start('来到了列表页，准备开始打开每个列表...');
        // 获取改页面的全部的 link 链接用来跳转
        const newPageLinkList = yield page.$$eval('dt > a', selectorAll => {
            return [...selectorAll].map(element => {
                const anchorElement = element;
                return anchorElement.href;
            });
        });
        const newPageLinkLength = newPageLinkList.length;
        let currentCount = 0;
        // 并发打开新窗口
        const btList = yield Promise.all(newPageLinkList.map((link, index) => __awaiter(this, void 0, void 0, function* () {
            const newPage = yield browser.newPage();
            yield newPage.goto(link);
            const fileName = yield newPage.$eval('.nobg', (element) => element.innerText);
            const info = yield newPage.$eval('.filelist:not(.second) .fileTree', fileTreeElement => {
                const children = fileTreeElement.children;
                return [children[0], children[1]].map((element) => {
                    const small = element.querySelector('small');
                    if (small == null)
                        return;
                    return small.innerText;
                });
            });
            const bt = yield newPage.$eval('.magta.ta', element => element.innerHTML);
            // 不用了就关掉吧
            newPage.close();
            currentCount += 1;
            spinner.text = `${currentCount}/${newPageLinkLength}`;
            return [fileName.slice(8), ...info, colors_1.default.cyan.bold(bt)];
        })));
        spinner.succeed('获取电影资源成功~~');
        table.push(...btList);
        console.log(table.toString());
        yield browser.close();
    });
}
//# sourceMappingURL=index.js.map