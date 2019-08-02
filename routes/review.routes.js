const express = require('express');
const reviewRouter = express.Router();
const reviewController = require('../controller/review.controller');

function router() {
    const { getReviewsById } = reviewController();
    reviewRouter.route('/getReviews/:id')
        .post(getReviewsById);
    
    return reviewRouter;

}

module.exports = router;