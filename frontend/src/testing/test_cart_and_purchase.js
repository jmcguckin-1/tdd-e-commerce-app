const {Builder, By, Select, Key, until} = require("selenium-webdriver");
const {assert, expect} = require("chai");

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function signIn(driver){
    await driver.get('http://localhost:3000');
    await driver.manage().window().maximize();
    await driver.findElement(By.id("email")).sendKeys("jdonnelly00@gmail.com");
    await driver.findElement(By.id("password")).sendKeys("Queens25!");
    const button = await driver.findElement(By.id("signInBtn"));
    await button.click();
    await sleep(3000); // give time for application to load
}

// function used to mock search functionality
async function search(driver){
  await driver.manage().window().maximize();
  const button1 = await driver.findElement(By.id("shop_all"));
  await button1.click();
  await sleep(3000); // give time for products to load
}

// function used to mock checkout functionality
async function checkout(driver){
    const cart = await driver.findElements(By.className('cart'));
    await cart[0].click();
    await sleep(2000);
    const checkout = await driver.findElement(By.id('checkout'));
    await checkout.click();
    await sleep(2000);
}

describe('Verify the cart checkout alert', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('empty cart should not let you checkout', async function () {
   await checkout(driver);
    await sleep(2000);
      try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
            // form alerting check
          await sleep(2000);
          assert.strictEqual(alertText, "You must put something in your cart to checkout");
          await alert.accept();
      } catch (error) {
        console.log(error);
      }

  }).timeout(30000);

after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});

// Adding to cart test
describe('Add to cart', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('Adding an item to cart works!', async function () {
   await search(driver);
       const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/item";
    assert.strictEqual(currentURL, expectedURL);
     await sleep(10000);
    const gridItems = await driver.findElements(By.className('grid-item'));

   for (const gridItem of gridItems) {
     const productNameElement = await gridItem.findElement(By.tagName('b'));

     const productName = await productNameElement.getText();

     if(productName.trim() === 'Alan Wake 2 (18)'){
        await gridItem.click();
        await sleep(5000);
         const button = await driver.findElement(By.id('addCart'));
         await button.click();
        try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
          // cart alerting check
          await sleep(2000);
          assert.strictEqual(alertText, "cart created!");
          await alert.accept();
      } catch (error) {
        console.log(error);
      }

     }

  }

  }).timeout(40000);

after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});


// Check cart display
describe('Displaying the cart contents', function () {
  let driver;

  before(async function () {
    this.timeout(25000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('Cart Display works!', async function () {
    const cart = await driver.findElements(By.className('cart'));
    await cart[0].click();
    await sleep(3000);

    const cartItems = await driver.findElements(By.className('cartContents'));
     for (const gridItem of cartItems) {
     const productNameElement = await gridItem.findElement(By.tagName('b'));
  const categoryElement = await gridItem.findElement(By.tagName('i'));

  const productName = await productNameElement.getText();
  const category = await categoryElement.getText();

  expect(productName.trim()).to.equal('Alan Wake 2');
  expect(category.trim()).to.equal('PS5 Games');
  }
  // assert the price is correct
  const price = await driver.findElement(By.id('total_price')).getText();
    assert.strictEqual("Total: £176.85", price);


  }).timeout(40000);

after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});


// Checkout button works

describe('Verify we can go to transactions', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('Checkout button works', async function () {
    await checkout(driver);
    const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/transactions";
    assert.strictEqual(currentURL, expectedURL);


  }).timeout(30000);

after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});

// Check order display works
describe('Verify we can see our order', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('Order Display works', async function () {
    await checkout(driver);

    const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/transactions";
    assert.strictEqual(currentURL, expectedURL);
     const next = await driver.findElement(By.id('nextPay'));
     await next.click();
     await sleep(2000);

    const cartItems = await driver.findElements(By.className('orderItem'));
     for (const gridItem of cartItems) {
     const productNameElement = await gridItem.findElement(By.tagName('b'));
  const categoryElement = await gridItem.findElement(By.tagName('i'));
  const imageElement = await gridItem.findElement(By.tagName('img'));

  const productName = await productNameElement.getText();
  const category = await categoryElement.getText();
  const imageSrc = await imageElement.getAttribute('src');

  expect(productName.trim()).to.equal('Alan Wake 2');
  expect(category.trim()).to.equal('PS5 Games');
  expect(imageSrc.trim()).to.equal('http://localhost:5000/images/alanwake2.jpg');

  }


  }).timeout(30000);

after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});

// autofill stuff works
describe('Autofilling address', function () {
  let driver;

  before(async function () {
  this.timeout(25000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that autofill address works!', async function () {

    await checkout(driver);
    const address = await driver.findElement(By.id('addr-input'));
    await address.sendKeys("80 ");
    await sleep(2000);
    await address.sendKeys(Key.ARROW_DOWN);
    await address.sendKeys(Key.ENTER);
    await sleep(2000);
    const postcode = await driver.findElement(By.id('postcode'));
    const country = await driver.findElement(By.id('countryInput'));
    expect(postcode.getAttribute('value')).to.not.equal("");
    expect(country.getAttribute('value')).to.not.equal("");


  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});


// alert error handling works
describe('Alert pops up for email change', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('Order error handling works', async function () {
    await checkout(driver);
    const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/transactions";
    assert.strictEqual(currentURL, expectedURL);
     const email = await driver.findElement(By.id('emailInput'));
     await email.clear();
     await email.sendKeys("jmcguckin@outlook.com");

    const next = await driver.findElement(By.id('nextPay'));
     await next.click();
     await sleep(2000);

    const button = await driver.findElement(By.id('placeOrder'));
    await button.click();

    await sleep(2000);
      try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
            // form alerting check
          await sleep(2000);
          assert.strictEqual(alertText, "Emails should end in @gmail.com!");
          await alert.accept();
      } catch (error) {
        console.log(error);
      }
  }).timeout(35000);

after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});


describe('Transactions Language Change', function () {
  let driver;

  before(async function () {
  this.timeout(12000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that language change works!', async function () {

    await checkout(driver);
    const dropdown = await driver.findElement(By.id('transLang'));
    const select = new Select(dropdown);
    await select.selectByValue("fr");
    await sleep(2000);
    const element = await driver.findElement(By.id("nameLbl")).getText();
    const element2 = await driver.findElement(By.id("shipping")).getText();
    assert.strictEqual(element, "Nom");
    assert.strictEqual(element2, "adresse de livraison");
    await select.selectByValue("en");
    await sleep(2000);

     const engButton = await driver.findElement(By.id("nameLbl")).getText();
     const engLabel = await driver.findElement(By.id("shipping")).getText();

    assert.strictEqual(engButton, "Name");
    assert.strictEqual(engLabel, "Shipping Address");

  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});

// paypal popup

describe('Payment Flow works', function () {
  let driver;

  before(async function () {
  this.timeout(25000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify that Paypal integration works', async function () {

    await checkout(driver);
    const next = await driver.findElement(By.id('nextPay'));
     await next.click();
     await sleep(2000);

     const placeOrder = await driver.findElement(By.id('placeOrder'));
     await placeOrder.click();
     await sleep(2000);
      const payment = await driver.findElement(By.id('paymentPopup')).isDisplayed();
      assert.strictEqual(true, payment);
       const paypal = await driver.findElement(By.id('paypalBtn'));
     await paypal.click();
     await sleep(4000);

       const currentURL = await driver.getCurrentUrl();
    const expectedURL = "https://www.sandbox.paypal.com/";
    expect(currentURL).to.include(expectedURL);


  }).timeout(25000)

 after(async function () {
    await driver.quit();
  })
});




// cart menu alerts
describe('cart menu alerts', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
     const cart = await driver.findElements(By.className('cart'));
       await cart[0].click();
          await sleep(2000);
          const edit = await driver.findElement(By.id('editCart'));
          await edit.click();
          await sleep(2000);
  });

  const cartMenuData = [

    { input: "a", alertText: 'quantities entered should be valid numbers!', scen: "non-numeric values"},
    {input: "-10", alertText: 'quantities entered should be between 0 and 10', scen: "numbers out of range"},
  ];

  for (const testCase of cartMenuData) {
    it('cart should not be changed with ' + testCase.scen, async () => {
          const field = await driver.findElements(By.className('inputQuan'));
          await field[0].clear();
          await field[0].sendKeys(testCase.input);
          const change = await driver.findElement(By.id('changeQuan'));
          await change.click();
          await sleep(2000);

      try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
            assert.strictEqual(alertText, testCase.alertText);
            await alert.accept();
      } catch (error) {
        console.log(error);
      }
      }).timeout(30000);
}
after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});

// out of stock

describe('Item out of stock', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('verify if an item out of stock message appears', async function () {
   await search(driver);
       const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/item";
    assert.strictEqual(currentURL, expectedURL);
     await sleep(10000);

       const searchInput = await driver.findElement(By.id('search_input'));
      await searchInput.sendKeys("forza");
       const searchIcon = await driver.findElement(By.className("search"));
       await searchIcon.click();

       await sleep(3000); // wait for search results to appear
         const gridItems = await driver.findElements(By.className('grid-item'));

   for (const gridItem of gridItems) {
     const productNameElement = await gridItem.findElement(By.tagName('b'));

     const productName = await productNameElement.getText();

     if(productName.trim() === 'Forza Horizon 5 (7)'){
        await gridItem.click();
        await sleep(5000);
         const button = await driver.findElement(By.id('addCart'));
         await button.click();
        try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
          // out of stock alerting check
          await sleep(2000);
          assert.strictEqual(alertText, "Forza Horizon 5 (7) is out of stock!");
          await alert.accept();
      } catch (error) {
        console.log(error);
      }

     }

  }

  }).timeout(40000);

after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});



// cart edit menu
describe('cart menu changes', function () {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  const cartMenuData = [
    { input: "1", scen: "valid number change"},
    { input: "0",  scen: "valid removal"},
  ];

  for (const testCase of cartMenuData) {
    it('cart should be changed with ' + testCase.scen, async () => {
          const cart = await driver.findElements(By.className('cart'));
          await cart[0].click();
          await sleep(2000);
          const edit = await driver.findElement(By.id('editCart'));
          await edit.click();
          await sleep(2000);
          const field = await driver.findElements(By.className('inputQuan'));
          await field[0].clear();
          await field[0].sendKeys(testCase.input);
          const change = await driver.findElement(By.id('changeQuan'));
          await change.click();
          await sleep(2000);

      try {
        await driver.wait(until.alertIsPresent(), 5000);
        const alert = await driver.switchTo().alert();
         const alertText = await alert.getText();
            assert.strictEqual(alertText, "cart preferences updated");
            await alert.accept();
      } catch (error) {
        console.log(error);
      }
      await sleep(2000);
      }).timeout(30000);
}
after(async function () {
 if (driver){

  await driver.quit();
 }
  })
});
