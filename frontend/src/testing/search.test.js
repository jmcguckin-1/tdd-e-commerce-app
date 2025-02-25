const {Builder, By, until} = require("selenium-webdriver");
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

async function filter(driver){
    const filterButton = await driver.findElement(By.className("filter"));
    await filterButton.click();
    await sleep(2000); // give time for filter bar to appear
}

describe('Shop All', function () {
  let driver;

  before(async function () {
   this.timeout(16000);
    driver = new Builder().forBrowser('chrome').build();
    await signIn(driver);
  });

  it('Shop All Button works', async function () {
   await search(driver);
       const currentURL = await driver.getCurrentUrl();
    const expectedURL = "http://localhost:3000/item";
    assert.strictEqual(currentURL, expectedURL);

    await sleep(4000);
    const gridItems = await driver.findElements(By.className('grid-item'));

   for (const gridItem of gridItems) {
     const productNameElement = await gridItem.findElement(By.tagName('b'));
  const categoryElement = await gridItem.findElement(By.tagName('i'));
  const priceElement = await gridItem.findElement(By.css('.productDetails > b:last-child'));

  const productName = await productNameElement.getText();
  const category = await categoryElement.getText();
  const price = await priceElement.getText();

  expect(productName.trim()).to.not.equal('');
  expect(category.trim()).to.not.equal('');
  expect(price.trim()).not.equal('');
  }

  }).timeout(24000);

after(async function () {
 if (driver){
  await driver.quit();
 }
  })
});

async function search(driver){
  await driver.manage().window().maximize();
  const button1 = await driver.findElement(By.id("shop_all"));
  await button1.click();
  await sleep(7000); // give time for products to load
}

const data = [
  { link: "ps5Link", expectedUrl: "ps5item" },
  { link: "xbLink", expectedUrl: "XboxItem" },
  { link: "nsLink", expectedUrl: "NSItem" },
];

describe('Accessing different category pages', () => {
  let driver;

  before(async function (){
  this.timeout(10000);
    driver = await new Builder().forBrowser('chrome').build();

  });

  for (const testCase of data) {
    it(`should be able to access ${testCase.link} page`, async () => {
         await driver.manage().window().maximize();
       await driver.get('http://localhost:3000/landing');
      const linkEl = await driver.findElement(By.id(testCase.link));
      await linkEl.click();
      await sleep(3000);

      const currentURL = await driver.getCurrentUrl();
      const expectedURL = "http://localhost:3000/" + testCase.expectedUrl;
      assert.strictEqual(currentURL, expectedURL);
    }).timeout(25000);
  }

 after(async function () {
 if (driver){
  await driver.quit();
 }
  })
});

const searchData = [
  { term: "zelda"},
  { term: "mArIo"},
  { term: "God of War Ragnarok" },
  { term: "Spider-man" },
];

const differentInputs = [
  { term: "12"}, // number input
  { term: "" }, // should cause an alert!
  { term: "John" }, // should not be found
]

describe('Searching for valid items', () => {
  let driver;

  before(async function (){
   this.timeout(10000);
    driver = await new Builder().forBrowser('chrome').build();
  });


  for (const testCase of searchData) {
    it(`searching for ${testCase.term}`, async () => {
      await driver.get('http://localhost:3000/item');
      await driver.manage().window().maximize();
     const searchInput = await driver.findElement(By.id('search_input'));
      await searchInput.sendKeys(testCase.term);
       const searchIcon = await driver.findElement(By.className("search"));
       await searchIcon.click();

       await sleep(3000); // wait for search results to appear

      const display = await driver.findElement(By.className("grid-container")).isDisplayed();
    assert.strictEqual(true, display)

    const gridItems = await driver.findElements(By.className('grid-item'));

   for (const gridItem of gridItems) {
       const productNameElement = await gridItem.findElement(By.tagName('b'));

       const productName = await productNameElement.getText();

       expect(productName.trim().toLowerCase()).to.include(testCase.term.toLowerCase());
   }

    }).timeout(25000);
  }

after(async function () {
 if (driver){
  await driver.quit();
 }
  })
});


describe('Searching for unconventional items (Expects not found message or an alert)', () => {
  let driver;

  before(async function() {
    this.timeout(4000);
    driver = await new Builder().forBrowser('chrome').build();
  });


  for (const testCase of differentInputs) {
    it(`searching for ${testCase.term}`, async () => {
      await driver.get('http://localhost:3000/item');
      await driver.manage().window().maximize();
     const searchInput = await driver.findElement(By.id('search_input'));
      await searchInput.sendKeys(testCase.term);
       const searchIcon = await driver.findElement(By.className("search"));
       await searchIcon.click();

    await sleep(2000) // wait for search results to appear
      if (testCase.term !== ""){
              const display = await driver.findElement(By.id("noProducts")).isDisplayed();
              assert.strictEqual(true, display)
      }
      else{
      try {
    await driver.wait(until.alertIsPresent());
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();

    assert.strictEqual(alertText, 'please enter a search term before continuing!');
    await alert.accept();
  } catch (error) {
    console.log('Error handling alert:', error.message);
  }

      }

    }).timeout(25000);
  }

after(async function () {
 if (driver){
  await driver.quit();
 }
  })});

const filterData = [
  { term: "PS5F", expected: "PS5 Games"},
  { term: "NSF", expected: "Nintendo Switch Games"},
  { term: "XboxF", expected: "Xbox Games" },
];

const delivData = [
  { term: "free", expected: "free delivery"},
  { term: "std", expected: "standard delivery"},
];

const range = [
{ min: 45, max: 80},
{ min: 60, max: 100},
{ min: 40, max: 80}
]


describe('Filter by Category', () => {
  let driver;

  before(async function () {
    this.timeout(18000);
    driver = await new Builder().forBrowser('chrome').build();
    await signIn(driver);
     await search(driver);
  });

  for (const testCase of filterData) {
    it(`filtering for ${testCase.expected}`, async () => {
       await filter(driver);
      const display = await driver.findElement(By.id("filterBar")).isDisplayed();
    assert.strictEqual(true, display)
    const clearC = await driver.findElement(By.id("clearChoices"));
     await clearC.click();
     const categoryCheckBox = await driver.findElement(By.id(testCase.term));
     await categoryCheckBox.click();
     await sleep(2000); // ensure checkbox has been clicked

      const refine = await driver.findElement(By.id("refine"));
     await refine.click();

     await sleep(5000); // wait for bar to disappear and results to display

    const gridItems = await driver.findElements(By.className('grid-item'));

   for (const gridItem of gridItems) {
       const categoryElement = await gridItem.findElement(By.tagName('i'));

       const categoryName = await categoryElement.getText();

       expect(categoryName.trim().toLowerCase()).to.equal(testCase.expected.toLowerCase());
   }

    }).timeout(40000);
  }

 after(async function () {
 if (driver){
  await driver.quit();
 }
  })
});

describe('Filter by Delivery', () => {
  let driver;

  before(async function () {
    this.timeout(20000);
    driver = await new Builder().forBrowser('chrome').build();
    await signIn(driver);
    await search(driver);
  });

  for (const testCase of delivData) {
    it(`filtering for ${testCase.expected}`, async () => {
       await filter(driver);
      const display = await driver.findElement(By.id("filterBar")).isDisplayed();
    assert.strictEqual(true, display)
     const clearC = await driver.findElement(By.id("clearChoices"));
     await clearC.click();
     const deliveryCheckBox = await driver.findElement(By.id(testCase.term));
     await deliveryCheckBox.click();
     await sleep(1000); // ensure checkbox has been clicked

      const refine = await driver.findElement(By.id("refine"));
     await refine.click();

     await sleep(5000); // ensure that bar has disappeared and results displayed

    const gridItems = await driver.findElements(By.className('grid-item'));

   for (const gridItem of gridItems) {
      const priceElement = await gridItem.findElement(By.css('.productDetails > b:last-child'));

       const priceText= await priceElement.getText();

       expect(priceText.trim().toLowerCase()).to.include(testCase.expected.toLowerCase());
   }

    }).timeout(35000);
  }

 after(async function () {
 if (driver){
  await driver.quit();
 }
  })
});

describe('Logout functionality', function () {
  let driver;

  before(async function () {
    this.timeout(10000);
    driver = await new Builder().forBrowser('chrome').build();

  });

  it('should log out using the door icon and the popup', async function () {
    await driver.get('http://localhost:3000/landing');
    await driver.manage().window().maximize();
    const doorIcon = await driver.findElement(By.className('logout'));
    await doorIcon.click();
    await sleep(2000);

    const popconfirm = await driver.findElement(By.className("popup"));

    const popupOn = await popconfirm.isDisplayed();
    assert.strictEqual(true, popupOn)

    const buttons = await driver.findElements(By.className('ant-btn-primary'));
    const yes = buttons[0];
    await yes.click();

    await sleep(2000);

    const currentUrl = await driver.getCurrentUrl();
   assert.strictEqual("http://localhost:3000/", currentUrl )
  }).timeout(20000);

after(async function () {
 if (driver){
  await driver.quit();
 }
  })
});
