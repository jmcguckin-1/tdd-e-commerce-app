const {Builder, By, until, Select} = require("selenium-webdriver");
const {assert} = require("chai");

const fs = require('fs');

const readAndUpdateCounter = () => {
  let emailCounter;
  try {
    emailCounter = JSON.parse(fs.readFileSync('email_counter.json', 'utf-8')) || { counter: 0 };
  } catch (error) {
    emailCounter = { counter: 0 };
  }

  const currentCounter = emailCounter.counter;
  emailCounter.counter++;

  fs.writeFileSync('email_counter.json', JSON.stringify(emailCounter));

  return { currentCounter, updatedCounter: emailCounter.counter };
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
describe('Sign Up', function () {
  let driver;
  let counter;
  before(async function () {
   this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
    const counter = readAndUpdateCounter();
    current = counter.currentCounter;
  });

  it('verify that normal Sign up works', async function () {
    await driver.get('http://localhost:3000/signup');
    await driver.manage().window().maximize()
    await driver.findElement(By.id("name")).sendKeys("John M");
    await driver.findElement(By.id("email1")).sendKeys("jmcguckin0" + current + "@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("QueensFirst23!");
    await driver.findElement(By.id("verify_password")).sendKeys("QueensFirst23!");
    await driver.findElement(By.className("button-44")).click();
    await sleep(4000);
    const element = await driver.findElement(By.id("landing")).isDisplayed();
    assert.strictEqual(element, true)

  }).timeout(20000)

 after(async function () {
 if (driver){
  await driver.quit();
 }
  })

});


describe('Strong password!', function () {
  let driver;

  before(async function () {
   this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
  });

  it('alert for password should display, then when a strong password is entered it should disappear', async function () {
    await driver.get('http://localhost:3000/signup');
    await driver.manage().window().maximize()
    const alert = await driver.findElement(By.className("alert2")).isDisplayed()
    assert.strictEqual(alert, true);

    await driver.findElement(By.id("password")).sendKeys("Queens22!");
    await driver.findElement(By.id("verify_password")).sendKeys("Queens22!");

    const alert2 = await driver.findElement(By.className("alert2")).isDisplayed()
    assert.strictEqual(alert2, false);

  }).timeout(20000)

 after(async function () {
 if (driver){
  await driver.quit();
 }
  })

});

describe('link works', function () {
  let driver;

  before(async function () {
   this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
  });

  it('verify that link to sign in page works', async function () {
    await driver.get('http://localhost:3000/signup');
    await driver.manage().window().maximize()
    await driver.findElement(By.id("signInLink")).click();
    await sleep(2000); // wait for page to load
    const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/";
    assert.strictEqual(currentURL, expectedURL);

  }).timeout(20000)

 after(async function () {
 if (driver){
  await driver.quit();
 }
  })

});

const signUpAlertData = [
  {name: "", email: "", password: "", v_password: "", scen: "empty fields", test: 1}, // empty fields
  {name: "John McGuckin", email: "jmcguckin00@gmail.com", password: "'/$trong@QUB1'", v_password: "'/$trong@QUB1'", scen: "an email already being used", test: 2}, // email already used
]

describe('Sign Up Alerts', () => {
  let driver;

  before(async function () {
    this.timeout(10000);
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  for (const testCase of signUpAlertData) {
    it(`should not sign up with ${testCase.scen}`, async () => {
      await driver.get('http://localhost:3000/signup');
      await driver.manage().window().maximize();
      await driver.findElement(By.id('name')).sendKeys(testCase.name);
      await driver.findElement(By.id('email1')).sendKeys(testCase.email);
      await driver.findElement(By.id('verify_password')).sendKeys(testCase.v_password);
      await driver.findElement(By.id('password')).sendKeys(testCase.password);
      await driver.findElement(By.className('button-44')).click();
      await sleep(4000);

      switch (testCase.test) {
        case 1:
          // Empty fields alert
           try {
            await driver.wait(until.alertIsPresent());
            const alert = await driver.switchTo().alert();
            const alertText = await alert.getText();
            // email already exists alert
            assert.strictEqual(alertText, 'Emails should end in @gmail.com!');
            await alert.accept();
          } catch (error) {
            console.log('Error handling alert:', error.message);
          }
          const alert1 = await driver.findElement(By.className('alert')).isDisplayed();
          assert.strictEqual(alert1, true);
          break;

        case 2:
          try {
            await driver.wait(until.alertIsPresent());
            const alert = await driver.switchTo().alert();
            const alertText = await alert.getText();
            // email already exists alert
            assert.strictEqual(alertText, 'Email "jmcguckin00@gmail.com" already exists');
            await alert.accept();
          } catch (error) {
            console.log('Error handling alert:', error.message);
          }
          break;

        default:
          break;
      }
      const url = await driver.getCurrentUrl();
      assert.strictEqual(url, "http://localhost:3000/signup");
    }).timeout(20000);
  }
});

describe('Sign Up Language Change', function () {
  let driver;

  before(async function () {
  this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
  });

  it('verify that language change works!', async function () {
    await driver.get('http://localhost:3000/signup');
    await driver.manage().window().maximize()
    const dropdown = await driver.findElement(By.id('langSignUp'));
    const select = new Select(dropdown);
    await select.selectByValue("fr");
    await sleep(2000);
    const element = await driver.findElement(By.id("signUpHeading")).getText();
    const element2 = await driver.findElement(By.id("signInLink")).getText();
    assert.strictEqual(element2, "Avoir un compte? Se connecter ici!");
    assert.strictEqual(element, "S'inscrire!");
    await select.selectByValue("en");
    await sleep(2000);

     const engButton = await driver.findElement(By.id("signUpHeading")).getText();
     const engLink = await driver.findElement(By.id("signInLink")).getText();

    assert.strictEqual(engLink, "Have an account? Sign In here!");
    assert.strictEqual(engButton, "Sign Up!");

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});



const testData = [
  {password: "Pass1!", v_password: "Pass1!", scen: " is not long enough"}, // not long enough
  {password: "password1!", v_password: "password1!", scen: "has no caps"}, // password has no caps
  { password: "pass@QUB", v_password: "pass@QUB", scen: "has no password"}, // Password has no numbers
   { password: "passQUB12", v_password: "passQUB12", scen: "has no special characters"}, // Password has no special characters
  {password: "QUB@12!John", v_password: "password", scen: "does not match"}, // passwords don't match
]

describe('Bad passwords', () => {
  let driver;

  before(async function () {
  this.timeout(10000);
    driver = await new Builder().forBrowser('chrome').build();
  });
    after(async function () {
 if (driver){
  await driver.quit();
 }
  })

  for (const testCase of testData) {
    it('should not sign up with a password that ' + testCase.scen, async () => {
      await driver.get('http://localhost:3000/signup');
      await driver.manage().window().maximize();
      await driver.findElement(By.id('name')).sendKeys("John");
      await driver.findElement(By.id('email1')).sendKeys("jmcguckin@gmail.com");
      await driver.findElement(By.id('verify_password')).sendKeys(testCase.v_password);
      await driver.findElement(By.id('password')).sendKeys(testCase.password);
      await driver.findElement(By.className('button-44')).click();
      await sleep(4000);

      // checks we are still on the sign up page
      const url = await driver.getCurrentUrl();
      assert.strictEqual("http://localhost:3000/signup", url);

      // confirm that the password alert is displayed cause it is not strong.
      const alert = await driver.findElement(By.className('alert2')).isDisplayed();
      assert.strictEqual(alert, true);

    }).timeout(20000)
  }

});