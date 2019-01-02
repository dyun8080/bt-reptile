import puppeteer from 'puppeteer'
import Table from 'cli-table3';
import colors from 'colors';
import ora from 'ora';

init();

const keyWord = '复仇者联盟';

const table = new Table({
  head: ['Name', 'Size', 'Time', 'BT'],
  style: {
    head: [],
    border: [],
  },
  colWidths: [60, 12, 10, 70],
}) as any;

async function init() {
  // 要一个搞事的浏览器
  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1080,
      height: 1920,
    }
  });
  // 打开一个页面
  const page = await browser.newPage();

  await page.goto('http://www.zhizhud.com/');

  console.log('输入关键字中...')

  // 搜索关键字，设置点延时来模拟用户输入
  await page.type('#search', keyWord, { delay: 100 })

  const spinner = ora('输入完成~~, 准备跳转新页面').start();

  await Promise.all([
    page.waitForNavigation(),
    page.click('#btnSearch'),
  ]);

  spinner.succeed()

  spinner.start('来到了列表页，准备开始打开每个列表...');

  // 获取改页面的全部的 link 链接用来跳转
  const newPageLinkList = await page.$$eval('dt > a', selectorAll => {
    return [...selectorAll].map(element => {
      const anchorElement = element as HTMLAnchorElement;
      return anchorElement.href;
    })
  })

  const newPageLinkLength = newPageLinkList.length;
  let currentCount = 0;

  // 并发打开新窗口
  const btList = await Promise.all(newPageLinkList.map(async (link, index) => {
    const newPage = await browser.newPage();
    await newPage.goto(link);

    const fileName = await newPage.$eval('.nobg', (element: any) => element.innerText) as string;

    const info = await newPage.$eval('.filelist:not(.second) .fileTree', fileTreeElement => {
      const children = fileTreeElement.children;

      return [children[0], children[1]].map((element) => {
        const small = element.querySelector('small')

        if (small == null) return

        return small.innerText
      })
    });

    const bt = await newPage.$eval('.magta.ta', element => element.innerHTML);
    // 不用了就关掉吧
    newPage.close()

    currentCount +=1;

    spinner.text = `${currentCount}/${newPageLinkLength}`;

    return [fileName.slice(8), ...info, colors.cyan.bold(bt)];
  }));

  spinner.succeed('获取电影资源成功~~');

  table.push(...btList)
  console.log(table.toString())

  await browser.close();
}
