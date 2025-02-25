const {Builder, By, Select, Key, until} = require("selenium-webdriver");
const {assert, expect} = require("chai");

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function signIn(driver){
    await driver.get('http://localhost:3000');
    await driver.manage().window().maximize();
    await driver.findElement(By.id("email")).sendKeys("jmcguckin00@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("Queens25!");
    const button = await driver.findElement(By.id("signInBtn"));
    await button.click();
    await sleep(3000); // give time for application to load
}

async function profile(driver){
      const profileIcon = await driver.findElement(By.id('profileIcon'));
    await profileIcon.click();
    await sleep(2000);
}

describe('Profile Display', function () {
  let driver;

  before(async function () {
   this.timeout(25000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('Profile displays as expected', async function () {
       await profile(driver);
       const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/profile";
    assert.strictEqual(currentURL, expectedURL);
    await sleep(2000);
     const name = await driver.findElement(By.id('displayName'));
     const email = await driver.findElement(By.id('displayEmail'));

     const nameText = await name.getText();
     const emailText = await email.getText();

     assert.strictEqual(emailText, "Email: jmcguckin00@gmail.com");
      const orderH = await driver.findElement(By.id('order_h')).isDisplayed();
     const discounts = await driver.findElement(By.id('discount')).isDisplayed();
      const changeP = await driver.findElement(By.id('change_p')).isDisplayed();

      assert.strictEqual(orderH, true);
      assert.strictEqual(discounts, true);
      assert.strictEqual(changeP, true);


  }).timeout(24000);

after(async function () {
 if (driver){
  await driver.quit();
 }
  })
});

// language change

describe('Profile Language Change', function () {
  let driver;

  before(async function () {
  this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that language change works!', async function () {

    await profile(driver);
    const dropdown = await driver.findElement(By.id('transProfile'));
    const select = new Select(dropdown);
    await select.selectByValue("fr");
    await sleep(2000);
    const element = await driver.findElement(By.id("orderH")).getText();
    const element2 = await driver.findElement(By.id("discount_m")).getText();
    assert.strictEqual(element, "Historique des commandes");
    assert.strictEqual(element2, "Appliquer un code de réduction");
    await select.selectByValue("en");
    await sleep(2000);

     const engButton = await driver.findElement(By.id("orderH")).getText();
     const engLabel = await driver.findElement(By.id("discount_m")).getText();

    assert.strictEqual(engButton, "Order History");
    assert.strictEqual(engLabel, "Apply a discount code");

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});

// order history
describe('Order History Display', function () {
  let driver;

  before(async function () {
  this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that order history displays!', async function () {

    await profile(driver);
    const orderHistory = await driver.findElement(By.id('order_h'));
    await orderHistory.click();
    await sleep(3000);

    const display = await driver.findElement(By.id('orderHistory')).isDisplayed();
    assert.strictEqual(display, true);
  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});


// edit details
describe('Change Details - valid change', function () {
  let driver;

  before(async function () {
  this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that valid detail change works!', async function () {

    await profile(driver);
    const edit = await driver.findElement(By.id('edit'));
    await edit.click();
    await sleep(2000);

    const detailsForm = await driver.findElement(By.id('detailsForm')).isDisplayed();
    assert.strictEqual(detailsForm, true);

    await driver.findElement(By.id("nameEntry")).clear();
    await driver.findElement(By.id("nameEntry")).sendKeys("John");
     const address = await driver.findElement(By.id('addr-input'));
    await address.sendKeys("54 ");
    await sleep(2000);
    await address.sendKeys(Key.ARROW_DOWN);
    await address.sendKeys(Key.ENTER);
    await sleep(2000);

     const change = await driver.findElement(By.id('changeD'));
    await change.click();

    await sleep(2000);

     const name = await driver.findElement(By.id('displayName'));

     const nameText = await name.getText();

      const profileHub = await driver.findElement(By.id('userProfile')).isDisplayed();

     assert.strictEqual(profileHub, true);
     assert.strictEqual(nameText, "Name: John");

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});


// test change password alerts
describe('Password Verification Alert', function () {
  let driver;

  before(async function () {
  this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that password validation alert works!', async function () {

    await profile(driver);
    const changeP = await driver.findElement(By.id('change_p'));
    await changeP.click();
    await sleep(2000);

    const validate = await driver.findElement(By.id('validatePass'));
     await validate.click();
    await sleep(2000);

     try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
          await sleep(2000);
          assert.strictEqual(alertText, "wrong code entered for account!");
          await alert.accept();
      } catch (error) {
        console.log(error);
      }

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});


// change details alerts

describe('Invalid change details', () => {
  let driver;

  before(async function() {
  this.timeout(20000);
    driver = await new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  const changeDetailsData = [
    { email: "jmcguckin00@yahoo.com", alertText: "Emails should end in @gmail.com!", scen: "non-Gmail emails"}, // wrong email provider
    { email: "jmcguckin308@gmail.com", alertText:'Email "jmcguckin308@gmail.com" already exists', scen: "an email that already exists" }, // duplicate email
  ];

  for (const testCase of changeDetailsData) {
    it('should not change details with ' + testCase.scen, async () => {
      await profile(driver);
      await driver.manage().window().maximize();
      const edit = await driver.findElement(By.id('edit'));
    await edit.click();
    await sleep(2000);
       await driver.findElement(By.id('oldEmail')).clear();
      if (testCase.email != ""){
       await driver.findElement(By.id('oldEmail')).sendKeys(testCase.email);
      }
      const button = await driver.findElement(By.id('changeD'));
      await button.click();
      await sleep(4000);

      try {
        await driver.wait(until.alertIsPresent(), 8000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
            // Change details alerting check
            assert.strictEqual(alertText, testCase.alertText);
            await alert.accept();
      } catch (error) {
        console.log(error);
      }
       await driver.get('http://localhost:3000/landing');
    }).timeout(30000)
  }
});

// discount code error

describe('Discount Error Alert', function () {
  let driver;

  before(async function () {
  this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that discount error alert works!', async function () {

    await profile(driver);
    const discounts = await driver.findElement(By.id('discount'));
    await discounts.click();
    await sleep(2000);

    const validate = await driver.findElement(By.id('discountValidation'));
     await validate.click();
    await sleep(2000);

     try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
          await sleep(2000);
          assert.strictEqual(alertText, "wrong discount code entered for account!");
          await alert.accept();
      } catch (error) {
        console.log(error);
      }

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});

// test for changing discord/preferences too
describe('Change Details - social features', function () {
  let driver;

  before(async function () {
  this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that valid social detail entry works!', async function () {

    await profile(driver);
    const edit = await driver.findElement(By.id('edit'));
    await edit.click();
    await sleep(2000);

    const detailsForm = await driver.findElement(By.id('detailsForm')).isDisplayed();
    assert.strictEqual(detailsForm, true);

    await driver.findElement(By.id("nameEntry")).clear();
    await driver.findElement(By.id("nameEntry")).sendKeys("John");
    await driver.findElement(By.id("discord_entry")).clear();
    await driver.findElement(By.id("discord_entry")).sendKeys("jmcguckin1");

    await driver.findElement(By.id("gamertag")).clear();
    await driver.findElement(By.id("gamertag")).sendKeys("johnmcguckin");

     const dropdown = await driver.findElement(By.id('pref'));
     const select = new Select(dropdown);
     await select.selectByValue("PS5 Games");
     await sleep(1000);

     const change = await driver.findElement(By.id('changeD'));
     await change.click();

     await sleep(2000);

     const preference = await driver.findElement(By.id('gameTag'));

     const prefText = await preference.getText();

     const discord = await driver.findElement(By.id('discord'));

     const discText = await discord.getText();

     const profileHub = await driver.findElement(By.id('userProfile')).isDisplayed();

     assert.strictEqual(profileHub, true);
     assert.strictEqual(prefText, "johnmcguckin - PS5 User");
     expect(discText.trim().toLowerCase()).to.include("jmcguckin1");

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});