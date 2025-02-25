const { Builder, By, until, Select, Keys } = require('selenium-webdriver');
const { assert } = require('chai');
const url = require("url");

const sleep = ms => new Promise(r => setTimeout(r, ms));

describe('Visiblity Check', function () {
  let driver;

  before(async function () {
  this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
  });

  it('sign in page display', async function () {
    await driver.get('http://localhost:3000');
    await driver.manage().window().maximize()
    const element = await driver.findElement(By.id("signInBtn")).getText();
    await sleep(3000); // wait for page to load
    assert.strictEqual(element,"Sign In");

  }).timeout(25000)

 after(async function () {
    if (driver) {
      await driver.quit();
    }
  });
});


// should be able to navigate to the signup in case user does not have account.
describe('Link Navigation', function () {
  let driver;

  before(async function () {
  this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
  });

  it('should check navigation for the link works', async function () {
    await driver.get('http://localhost:3000');
    await driver.manage().window().maximize();
    await driver.findElement(By.id("signUpLink")).click();
    await sleep(3000); // wait for page to load
    const element = await driver.findElement(By.id("signInLink")).getText();
    assert.strictEqual(element, "Have an account? Sign In here!");

  }).timeout(15000)

 after(async function () {
    if (driver) {
      await driver.quit();
    }
  });
});

describe('Normal Sign In', function () {
  let driver;

  before(async function () {
  this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
  });

  it('verify that normal Sign In works', async function () {
      await driver.get('http://localhost:3000');
    await driver.manage().window().maximize()
    await driver.findElement(By.id("email")).sendKeys("jmcguckin00@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("Queens25!");
    const button = await driver.findElement(By.id("signInBtn"));
    await button.click()
    await sleep(3000); // wait for page to load
    const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/landing";
    assert.strictEqual(currentURL, expectedURL);

  }).timeout(20000)

 after(async function () {
    await driver.quit();
  })
});

// users should be able to change lang to French, then back to English!
describe('Language Change', function () {
  let driver;

  before(async function () {
  this.timeout(10000);
    driver = new Builder().forBrowser('chrome').build();
  });

  it('verify that language change works!', async function () {
    await driver.get('http://localhost:3000');
    await driver.manage().window().maximize();
    await sleep(2000);
    const dropdown = await driver.findElement(By.id('langSignIn'));
    const select = new Select(dropdown);
    await select.selectByValue("fr");
    await sleep(2000); // wait for lang change
    const element = await driver.findElement(By.id("signInBtn")).getText();
    const element2 = await driver.findElement(By.id("signUpLink")).getText();
    assert.strictEqual(element2, "Vous n'avez pas de compte ? Inscrivez-vous ici !");
    assert.strictEqual(element, "Se connecter");
    await select.selectByValue("en");
    await sleep(2000) // wait for lang change

     const engButton = await driver.findElement(By.id("signInBtn")).getText();
    const engLink = await driver.findElement(By.id("signUpLink")).getText();

     assert.strictEqual(engLink, "Don't have an account? Sign Up here!");
    assert.strictEqual(engButton, "Sign In");

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});

describe('Invalid Sign In', () => {
  let driver;

  before(async function() {
  this.timeout(10000);
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  const signInData = [
    { email: "", password: "password", alertText: 'auth/invalid-email: Firebase: Error (auth/invalid-email).', scen: "invalid email"}, // invalid email
    { email: "jmcguckin00@gmail.com", password: "" , alertText: 'auth/missing-password: Firebase: Error (auth/missing-password).', scen: "missing password"}, // right email, no password entered
    { email: "jmcguckin@yahoo.com", password: "password", alertText: 'auth/user-not-found: Firebase: Error (auth/user-not-found).', scen: "invalid login details" }, // wrong email and password
  ];

  for (const testCase of signInData) {
    it('should not sign in with ' + testCase.scen, async () => {
      await driver.get('http://localhost:3000');
      await driver.manage().window().maximize();
      await driver.findElement(By.id('email')).sendKeys(testCase.email);
      await driver.findElement(By.id('password')).sendKeys(testCase.password);
      await driver.findElement(By.className('button-44')).click();
      await sleep(4000); // wait to sign in

      try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
            // Firebase alerting check
            assert.strictEqual(alertText, testCase.alertText);
            await alert.accept();
        const url = await driver.getCurrentUrl();
        assert.strictEqual(url, "http://localhost:3000/");
      } catch (error) {
        console.log(error);
      }
    }).timeout(20000)
  }
});






