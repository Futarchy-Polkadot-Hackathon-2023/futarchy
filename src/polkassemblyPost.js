/*
* USES eg: call commentOnRererendum('92', 'sweet comment') where 92 is the referenda id and it returns true after posting
*/

const USER = "demeg";
const PASSWORD = "Hello-123";

import webdriver from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";


async function commentOnRererendum(refId, commentText, user=USER, password=PASSWORD ) {
    let URL = "https://kusama.polkassembly.io/referendum/" + refId;

    const xpath_login_button = '//*[@id="root"]/section/header/nav/div/div[2]/div[5]/div/a'
    const userid_xpath = "/html/body/div[1]/section/section/section/main/div/div/article/form/div[1]/div/div/div/div/div/input"
    const password_xpath = "/html/body/div[1]/section/section/section/main/div/div/article/form/div[2]/div[1]/div/div/div/div/span/input"
    const submit_login_xpath = "/html/body/div[1]/section/section/section/main/div/div/article/form/div[3]/button"
    const rheader_xpath = '//*[@id="root"]/section/header/nav/div/div[2]'
    const comment_area_xpath = '//*[@id="comment-content-form"]/div[1]/div/div/div/div/div/div/div/div[2]/div/textarea'
    const commentsubmit_button = '//*[@id="comment-content-form"]/div[2]/div/div/div/div/div/button'

    var chromeOptions = new chrome.Options();
    const user_agent = 'user-agent=' + 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Safari/537.36'
    chromeOptions.addArguments(user_agent)
    chromeOptions.addArguments("--window-size=1920x1080")
    chromeOptions.addArguments("start-maximized");
    chromeOptions.addArguments("test-type");
    chromeOptions.addArguments("--js-flags=--expose-gc");
    chromeOptions.addArguments("--enable-precise-memory-info");
    chromeOptions.addArguments("--disable-popup-blocking");
    chromeOptions.addArguments("--disable-default-apps");
    chromeOptions.addArguments("--disable-infobars");
    chromeOptions.addArguments('--headless');

    let driver;
    try {
        driver = new webdriver.Builder()
        .forBrowser("chrome")
        .setChromeOptions(chromeOptions)
        .build();
    } catch (error) {
        
    }
  
    try {
        driver.get(URL)
        await driver.findElement(webdriver.By.xpath(xpath_login_button)).click()
        await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath(rheader_xpath)),5*1000);
        await driver.findElement(webdriver.By.xpath(userid_xpath)).sendKeys(user);
        await driver.findElement(webdriver.By.xpath(password_xpath)).sendKeys(password)
        await driver.findElement(webdriver.By.xpath(submit_login_xpath)).click()
        await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath(comment_area_xpath)),5*1000);
        await driver.findElement(webdriver.By.xpath(comment_area_xpath)).sendKeys(commentText)
        await driver.findElement(webdriver.By.xpath(commentsubmit_button)).click()
        await driver.wait(webdriver.until.elementLocated(webdriver.By.xpath(comment_area_xpath)),5*1000);

        await driver.close()
        return true

    }catch (error) {
        console.log(error)
    }

    await driver.close()
    return false
}

commentOnRererendum('263', 'testing123')
.then(data => console.log(data))

export default commentOnRererendum