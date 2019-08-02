const responseFormat = require('../util/response');
const logger = require('../util/logger');
const puppeteer = require('puppeteer');
const constants = require('../util/constants.json');

function reviewController() {
    async function getReviewsById(req, res) {
        let isNextPresent = true;
        let result = [];
        let pageNumber = 0;

        const id = req.params.id;
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Uncomment if headles mode is false
        // await page.setViewport({ width: 1920, height: 1080 });

        await page.setRequestInterception(true);

        // To make puppeteer browser not load css. It increases performance of puppeteer
        page.on('request', (req) => {
            if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font') {
                req.abort();
            }
            else {
                req.continue();
            }
        });

        logger.debugLog({ url: constants.scrapping_baseUrl + id }, null, "getReviewsById()", "Open target url");
        try {
            await page.goto(constants.scrapping_baseUrl + id);
        } catch (err) {
            logger.criticalLog({url : constants.scrapping_baseUrl + id}, null, "getReviewsById()", "Error in opening target url");
        }

        const isProductAvailable = await page.$$('#st404msg');
        const reviewPresent = await page.$$('#reviewtab a');

        if (Object.keys(isProductAvailable).length != 0) {
            logger.debugLog({ url: constants.scrapping_baseUrl + id }, null, "getReviewsById()", "Wrong product id provided");
            isNextPresent = false;
            result[0] = 1;
        } else if (Object.keys(reviewPresent).length == 0) {
            logger.debugLog({ url: constants.scrapping_baseUrl + id }, null, "getReviewsById()", "Reviews not present for the product");
            isNextPresent = false;
            result[0] = 2;
        } else {
            logger.debugLog({ url: constants.scrapping_baseUrl + id }, null, "getReviewsById()", "Clicking review tab");
            await page.click('#reviewtab a');
        }

        // Function extracts required information for the reviews present on the current page
        function getReviewsByPage() {
            return new Promise(async function (resolve, _reject) {
                let reviewList = await page.evaluate(() => {
                    let reviews = [];
                    try {
                        const allReviews = document.querySelectorAll(`#customerReviews`);
                        allReviews.forEach((review, index) => {
                            if (index != 0) {
                                let custReview = {
                                    comment: "",
                                    rating: "",
                                    date: "",
                                    name: ""
                                }
                                const dateName = review.querySelector('.reviewer').innerText.trim().split('\n');
                                const rating = review.querySelector('dd div.itemRating strong').innerHTML;
                                custReview.comment = review.querySelector('blockquote p').innerHTML;
                                custReview.name = dateName[1];
                                custReview.date = dateName[3];
                                custReview.rating = rating;
                                reviews.push(custReview);
                            }
                        });
                        return reviews;
                    } catch (err) {
                        logger.criticalLog({url : constants.scrapping_baseUrl + id}, null, "getReviewsByPage()", "Error in getting reviews on current page");
                    }
                })
                resolve(reviewList);
            })
        };

        // Loop iterates over next button till it is present
        while (isNextPresent) {
            if (pageNumber == 0) {
                pageNumber++;
                const reviewsPerPage = await getReviewsByPage();
                result = result.concat(reviewsPerPage);
            } else {
                pageNumber++;
                try {
                    const btns = await page.$$('.reviewPage dd a');
                    let temp = null;
                    for (const btnType of btns) {
                        const singleBtn = await page.evaluate(el => el.innerText, btnType);
                        if (singleBtn.split(' ')[0].trim() == 'Next')
                            temp = btnType
                    }
                    if (temp) {
                        await Promise.all([
                            page.waitForNavigation({ waitUntil: 'networkidle0' }),
                            temp.click()
                        ]);
                        const reviewsPerPage = await getReviewsByPage();
                        result = result.concat(reviewsPerPage);
                    }
                    else {
                        isNextPresent = false;
                    }
                } catch (err) {
                    logger.criticalLog({url : constants.scrapping_baseUrl + id}, null, "nextButtonLoop()", "Error in paginating reviews");
                }
            }
        }

        await browser.close();

        const functionName = "page.evaluate()";
        const errorForUser = {
            msg: ""
        };

        if (result[0] === 1) {
            errorForUser.msg = "Wrong product id provided";
            logger.errorLog({ url: constants.scrapping_baseUrl + id }, null, functionName, errorForUser.msg);
            res.json(responseFormat.getResponse("Error", errorForUser, false));
        }
        else if (result[0] === 2) {
            errorForUser.msg = "Reviews not present for the product";
            logger.errorLog({ url: constants.scrapping_baseUrl + id }, null, functionName, errorForUser.msg);
            res.json(responseFormat.getResponse("Error", errorForUser, false));
        } else {
            logger.debugLog({ params: req.params }, result, functionName, "Success");
            res.json(responseFormat.getResponse("Success", result, true));
        }
    }

    return {
        getReviewsById
    }
}

module.exports = reviewController;