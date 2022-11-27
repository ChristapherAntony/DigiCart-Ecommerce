const { request, response } = require('express');
var express = require('express');
const { ProfilingLevel } = require('mongodb');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const userHelper = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const adminHelpers = require('../helpers/admin-helpers');


module.exports = {
    dashboard: (req, res, next) => {
        res.redirect('/admin/dash');
    },
    adminLogin: (req, res) => {
        userHelper.adminLogin(req.body).then((response) => {
            if (response.status) {
                req.session.admin = response.user
                res.redirect('/admin/dash')
            } else {
                res.redirect('/admin/dash')
            }
        })
    },
    getDashBoard: async function (req, res, next) {
        const DashDetails = await adminHelpers.getDashDetails()
        const SalesReport = await adminHelpers.getSalesReport()
        const products = await productHelpers.getAllProductsLookUP()
        const TopSelling = await adminHelpers.topSelling()
        const OrderHistory = await adminHelpers.getRecentOrderHistory()
        const monthlygraph = await adminHelpers.monthlyR_P_S()   // revenues profit sales count
        res.render('admin/dash', { layout: 'admin-layout', DashDetails, SalesReport, products, TopSelling, OrderHistory, monthlygraph });
    },
    viewUsers: (req, res, next) => {
        userHelpers.getAllUsers().then((users) => {
            res.render('admin/view-users', { users, layout: 'admin-layout' })
        })
    },
    blockUser: function (req, res) {
        userHelpers.blockUser(req.params.id)
        res.redirect('/admin/view-users')
    },
    unBlockUser: function (req, res) {
        userHelpers.unBlockUser(req.params.id)
        res.redirect('/admin/view-users')
    },
    signOut: (req, res, next) => {
        req.session.destroy()
        res.redirect('/admin')
    },
    viewProductCategory: (req, res, next) => {
        categoryHelpers.getAllCategory().then((category) => {
            req.session.offer = false
            res.render('admin/product-category', { layout: 'admin-layout', category })
        })
    },
    getAddCategoryPage: (req, res, next) => {

        let categoryError = req.session.categoryError
        req.session.categoryError = null
        res.render('admin/add-category', { layout: 'admin-layout', categoryError })
    },
    addCategory: async (req, res, next) => {
        req.body.image = req.files.image[0].filename
        const addCategory = await categoryHelpers.addCategory(req.body)
        if (addCategory.status === false) {
            req.session.categoryError = "Your Entered Category Already exists! Try again..";
            res.redirect('/admin/add-category')
        } else {
            req.session.categoryError = null
            res.redirect("/admin/product-category")
        }
    },
    getEditCategory: async (req, res) => {
        let categoryId = req.params.id
        let categoryDetails = await categoryHelpers.getCategoryDetails(categoryId)
        res.render('admin/edit-category', { categoryDetails, layout: 'admin-layout' })
    },
    updateCategory: async (req, res) => {
        if (req.files.image == null) {
            Image1 = await productHelpers.fetchImage(req.params.id)
        } else {
            Image1 = req.files.image[0].filename
        }
        req.body.image = Image1
        categoryHelpers.updateCategory(req.params.id, req.body).then(async () => {
            let changeValues = await productHelpers.changeValues(req.params.id, req.body.categoryDiscount)
            if (req.session.offer) {
                res.redirect('/admin/offerManagement')
            } else {
                res.redirect('/admin/product-category')
            }
        })
    },
    getDeleteCategory: (req, res, next) => {
        let categoryId = req.params.id
        categoryHelpers.deleteCategory(categoryId).then((response) => {
            res.json(response)
        })
    },
    viewProducts: (req, res, next) => {
        productHelpers.getAllProductsLookUP().then((products) => {
            req.session.offer = false
            res.render('admin/view-products', { layout: 'admin-layout', products })
        })
    },
    getAddProducts: (req, res, next) => {
        categoryHelpers.getAllCategory().then((category) => {
            res.render('admin/add-product', { layout: 'admin-layout', category, productError: req.session.productError })
            req.session.productError = null
        })
    },
    categoryViseDiscount: (req, res, next) => {
        categoryHelpers.getCategoryDiscount(req.query.categoryName).then((response) => {
            res.json(response)
        })
    },
    addNewProduct: async (req, res) => {
        req.body.image1 = req.files.image1[0].filename
        req.body.image2 = req.files.image2[0].filename
        req.body.image3 = req.files.image3[0].filename
        req.body.image4 = req.files.image4[0].filename
        req.body.costPrice = parseInt(req.body.costPrice),
            req.body.MRP = parseInt(req.body.MRP),
            req.body.categoryDiscount = parseInt(req.body.categoryDiscount),
            req.body.productDiscount = parseInt(req.body.productDiscount),
            req.body.totalDiscount = parseInt(req.body.totalDiscount),
            req.body.offerPrice = parseInt(req.body.offerPrice),
            req.body.stock = parseInt(req.body.stock)
        const response = await productHelpers.addProduct(req.body)
        if (response.status === false) {
            req.session.productError = "Your Product Already exists! Try again..";
            res.redirect('/admin/add-product')
        } else {
            res.redirect('/admin/view-products')
        }

    },
    getEditProducts: async (req, res, next) => {
        let productId = req.params.id   //to get the clicked item id
        let product = await productHelpers.getProductDetails(productId)
        let productCategory = await productHelpers.getProductCategory(product.category)
        productCategoryName = productCategory.category
        categoryHelpers.getAllCategory().then((category) => {
            res.render('admin/edit-product', { category, layout: 'admin-layout', product, productCategoryName })
        })

    },
    updateProduct: async (req, res) => {
        if (req.files.image1 == null) {
            Image1 = await productHelpers.fetchImage1(req.params.id)
        } else {
            Image1 = req.files.image1[0].filename
        }
        if (req.files.image2 == null) {
            Image2 = await productHelpers.fetchImage2(req.params.id)
        } else {
            Image2 = req.files.image2[0].filename
        }
        if (req.files.image3 == null) {
            Image3 = await productHelpers.fetchImage3(req.params.id)
        } else {
            Image3 = req.files.image3[0].filename
        }
        if (req.files.image4 == null) {
            Image4 = await productHelpers.fetchImage4(req.params.id)
        } else {
            Image4 = req.files.image4[0].filename
        }
        req.body.image1 = Image1
        req.body.image2 = Image2
        req.body.image3 = Image3
        req.body.image4 = Image4
        productHelpers.updateProduct(req.params.id, req.body).then(() => {
            if (req.session.offer) {
                res.redirect('/admin/offerManagement')
            } else {
                res.redirect('/admin/view-products')
            }

        })
    },
    deleteProduct: (req, res, next) => {
        productHelpers.deleteProduct(req.params.id).then((response) => {
            res.json(response)
        })
    },
    viewAllOrders: (req, res, next) => {
        adminHelpers.getOrderHistory().then((OrderHistory) => {
            res.render('admin/View_Orders', { layout: 'admin-layout', OrderHistory })
        })
    },
    viewOrderDetails: async (req, res, next) => {
        let orderDetails = await adminHelpers.getOrderDetails(req.params.id)
        //let orderDetailsProducts = await adminHelpers.orderDetailsProducts(req.params.id) // old method chnaged to static
        let orderProductsDetails = await userHelpers.oldProductDetails(req.params.id)
        orderProductsDetails.forEach(cartDetails => {
            cartDetails.orderId = orderDetails._id
        })//added order id in to  the 'oldProductDetails' for accessing while on button click
        res.render('admin/View_Order_Details', { layout: 'admin-layout', orderDetails, orderProductsDetails })
    },
    changeDeliveryStatus: (req, res) => {
        adminHelpers.changeDeliveryStatus(req.body).then((response) => {
            res.json({ status: true })

        })
    },
    viewSalesReport: async (req, res, next) => {
        const SalesReport = await adminHelpers.getSalesReport()
        res.render('admin/view_Sales_Report', { layout: 'admin-layout', SalesReport })
    },
    salesReportByDate: async (req, res, next) => {
        let dateRange = {}
        if (req.body.fromDate === "" || req.body.toDate === "") {
            res.redirect('/admin/view_Sales_Report')
        } else {
            dateRange.fromDate = req.body.fromDate
            dateRange.toDate = req.body.toDate
        }
        const SalesReport = await adminHelpers.getSalesReportByDate(dateRange)
        res.render('admin/view_Sales_Report', { layout: 'admin-layout', SalesReport })

    },
    viewOfferManagementPage: async (req, res, next) => {
        let category = await categoryHelpers.getAllCategory()
        let products = await productHelpers.getAllProductsLookUP()
        req.session.offer = true
        console.log(products);
        res.render('admin/offer-management', { layout: 'admin-layout', category, products })
    },
    viewCouponManagementPage: async (req, res, next) => {
        let activeCoupons = await adminHelpers.getActiveCoupons()
        let expiredCoupons = await adminHelpers.getExpiredCoupons()
        res.render('admin/CouponManagements', { layout: 'admin-layout', activeCoupons, expiredCoupons, couponError: req.session.couponError })
        req.session.couponError = null
    },
    addNewCoupon: async (req, res, next) => {
        req.body.couponDiscount = parseInt(req.body.couponDiscount)
        req.body.maxAmount = parseInt(req.body.maxAmount)
        req.body.minSpend = parseInt(req.body.minSpend)
        let addCoupon = await adminHelpers.addNewCoupon(req.body)
        if (addCoupon.status === false) {
            req.session.couponError = "Your Entered Coupon code Already exists! Try again..";
        } else {
            req.session.couponError = null
            res.redirect('/admin/CouponManagements')
        }

    },
    updateCoupon: async (req, res, next) => {
        let updateCoupon = await adminHelpers.updateCoupon(req.body)
        res.redirect('/admin/CouponManagements')
    },
    deleteCoupon: async (req, res, next) => {
        let deleteCoupon = await adminHelpers.deleteCoupon(req.body)
        res.json(response)
    },
    applyCouponDiscount: async (req, res, next) => {
        let getCouponDiscount = await adminHelpers.getCouponDiscount(req.params.couponCode)
        res.json(getCouponDiscount)
    },
    getTopBanner: async (req, res, next) => {
        const bannerTop_main = await productHelpers.getBannerTop_main()
        res.render('admin/topBanner', { layout: 'admin-layout', bannerTop_main })
    },
    getAddBannerPage: async (req, res, next) => {
        res.render('admin/add-banner', { layout: 'admin-layout' })
    },
    addNewBanner: (req, res) => {
        req.body.largeImg = req.files.largeImg[0].filename
        req.body.smallImg = req.files.smallImg[0].filename
        productHelpers.addBanner(req.body)
        res.redirect('/admin/topBanner')
    },
    getEditBannerPage: async (req, res) => {
        let topBanner = await productHelpers.getBannerDetails(req.params.id)
        res.render('admin/edit-TopBanner', { layout: 'admin-layout', topBanner })
    },
    updateTopBanner: async (req, res) => {

        if (req.files.largeImg == null) {
            temp1 = await productHelpers.fetchBannerImg(req.params.id, "largeImg")
        } else {
            temp1 = req.files.largeImg[0].filename
        }
        if (req.files.smallImg == null) {
            temp2 = await productHelpers.fetchBannerImg(req.params.id, "smallImg")
        } else {
            temp2 = req.files.smallImg[0].filename
        }
        req.body.largeImg = temp1
        req.body.smallImg = temp2
        productHelpers.updateBanner(req.params.id, req.body).then((response) => {
            res.redirect('/admin/topBanner')
        })
    },
    deleteTopBanner: (req, res, next) => {
        productHelpers.deleteTopBanner(req.params.id).then((response) => {
            res.json(response)
        })
    },
    viewAdminProfile: (req, res, next) => {
        res.render('admin/profile', { layout: 'admin-layout' })
    }








}

