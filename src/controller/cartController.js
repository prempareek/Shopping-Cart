const cartModel = require("../Models/cartModel");
const productModel = require("../Models/productModel");
const userModel = require("../Models/userModel")
const validator = require("../validator/validator")


const createCart = async (req, res) => {
    try {
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: "Please provide input " }) }

        let cId = data.cartId;
        let pId = data.productId;
        let uId = req.params.userId;

        if (!cId) {
            let cartExistforUser = await cartModel.findOne({ userId: uId })
            if (cartExistforUser) {
                return res.status(400).send({ status: false, message: "Cart already exist for this user. PLease provide cart Id or delete the existing cart" })
            }
        }

        if (!pId) { return res.status(400).send({ status: false, message: "Please provide Product Id " }) }


        if (Object.keys(uId) == 0) { return res.status(400).send({ status: false, message: "Please provide User Id " }) }

        let userExist = await userModel.findOne({ _id: uId });
        if (!userExist) {
            return res.status(404).send({ status: false, message: `No user found with this ${uId}` })
        }


        let cartExist = await cartModel.findOne({ _id: cId });
        if (cartExist) {
            if (cartExist.userId != uId) {
                return res.status(403).send({ status: false, message: "This cart does not belong to you. Please check the cart Id" })
            }
            let updateData = {}

            for (let i = 0; i < cartExist.items.length; i++) {
                if (cartExist.items[i].productId == pId) {
                    cartExist.items[i].quantity = cartExist.items[i].quantity + 1;

                    updateData['items'] = cartExist.items
                    const productPrice = await productModel.findOne({ _id: pId, isDeleted: false }).select({ price: 1, _id: 0 })
                    if (!productPrice) { return res.status(404).send({ status: false, mesaage: `No product found with this ${pId}` }) }
                    nPrice = productPrice.price;
                    updateData['totalPrice'] = cartExist.totalPrice + (nPrice * 1)
                    updateData['totalItems'] = cartExist.items.length;

                    const updatedCart = await cartModel.findOneAndUpdate({ _id: cId }, updateData, { new: true })
                    return res.status(200).send({ status: true, message: "Updated Cart", data: updatedCart })
                }
                if (cartExist.items[i].productId !== pId && i == cartExist.items.length - 1) {
                    const obj = { productId: pId, quantity: 1 }
                    let arr = cartExist.items
                    arr.push(obj)
                    updateData['items'] = arr

                    const productPrice = await productModel.findOne({ _id: pId, isDeleted: false }).select({ price: 1, _id: 0 })
                    if (!productPrice) { return res.status(404).send({ status: false, mesaage: `No product found with this ${pId}` }) }
                    nPrice = productPrice.price
                    updateData['totalPrice'] = cartExist.totalPrice + (nPrice * 1)
                    updateData['totalItems'] = cartExist.items.length;

                    const updatedCart = await cartModel.findOneAndUpdate({ _id: cId }, updateData, { new: true })
                    return res.status(200).send({ status: true, message: "Updated Cart", data: updatedCart })
                }
            }

        }
        else {
            let newData = {}
            let arr = []
            newData.userId = uId;

            const object = { productId: pId, quantity: 1 }
            arr.push(object)
            newData.items = arr;

            const productPrice = await productModel.findOne({ _id: pId, isDeleted: false }).select({ price: 1, _id: 0 })
            if (!productPrice) { return res.status(404).send({ status: false, mesaage: `No product found with this ${pId}` }) }
            nPrice = productPrice.price;
            newData.totalPrice = nPrice;

            newData.totalItems = arr.length;

            const newCart = await cartModel.create(newData)

            return res.status(201).send({ status: true, message: "Cart details", data: newCart })


        }

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const { cartId, productId, removeProduct } = req.body
        const key = Object.keys(req.body)
        if (key == 0) {
            return res.status(400).send({ status: false, message: "please enter some data" })
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }
        if (!validator.isValid(cartId)) {
            return res.status(400).send({ status: false, message: "cartId is required" })
        }
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "cartId is invalid" })
        }
        if (!validator.isValid(productId)) {
            return res.status(400).send({ status: false, message: "productId is required" })
        }
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId is invalid" })
        }
        if (!validator.isValid(removeProduct)) {
            return res.status(400).send({ status: false, message: "removeProduct is required" })
        }
        let cartData = await cartModel.findOne({ _id: cartId })
        if (!cartData) { return res.status(404).send({ status: false, message: "cartData not found !" }) }

        if (typeof removeProduct != 'number') {
            return res.status(400).send({ status: false, message: "only number are allowed!" })
        }

        if (removeProduct == 0) {
            let items = []
            let dataObj = {}
            let removePrice = 0
            for (let i = 0; i < cartData.items.length; i++) {
                if (cartData.items[i].productId != productId) {
                    return res.status(400).send({ status: false, message: "product not found in the cart" })
                }
                if (cartData.items[i].productId == productId) {
                    const productRes = await productModel.findOne({ _id: productId, isDeleted: false }).select({_id:0,price:1})
                    
                    if (!productRes) { return res.status(404).send({ status: false, message: "product not found !" }) }
                    removePrice = productRes.price * cartData.items[i].quantity
                }
                else{
                items.push(cartData.items[i])
                productPrice = cartData.totalPrice;
                }

            }
            productPrice = cartData.totalPrice - removePrice;
            
            dataObj['totalPrice'] = productPrice
            dataObj['totalItems'] = items.length
            dataObj['items'] = items
            const removeRes = await cartModel.findOneAndUpdate({ productId: productId }, dataObj, { new: true })
            return res.status(200).send({ status: true, message: "remove success", data: removeRes })

        }
        if (removeProduct == 1) {
            let dataObj = {}
            let item = []
            let itemPrice = 0
            for (let i = 0; i < cartData.items.length; i++) {
                if (cartData.items[i].productId != productId) {
                    return res.status(400).send({ status: false, message: "product not found in the cart" })
                }
                if (cartData.items[i].productId == productId) {
                    const productRes = await productModel.findOne({ _id: productId, isDeleted: false }).select({ _id: 0, price: 1 })
                    if (!productRes) { return res.status(404).send({ status: false, message: "product not found !" }) }
                    if(cartData.items[i].quantity == 1){
                        itemPrice = cartData.totalPrice - productRes.price
                    }
                    else{
                        item.push({productId:productId,quantity:cartData.items[i].quantity - 1})
                        itemPrice = cartData.totalPrice - productRes.price
                    }
                    console.log(productRes.price,itemPrice)
                    
                }
                else{
                    item.push(cartData.items[i])
                }


                let reduceData = await cartModel.findOneAndUpdate({ productId: productId },{totalPrice:itemPrice,totalItems:item.length,items:item}, { new: true })
                return res.status(200).send({ status: true, message: "success", data: reduceData })

            }

        }

        else {
            return res.status(400).send({ status: false, message: "removeProduct field should be allowed only 0 and 1 " })
        }

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




const getCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (Object.keys(userId) == 0) {
            return res.status(400).send({ status: false, message: "userId is required" })
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }
        const getData = await cartModel.findOne({ userId: userId }).select({ _id: 0 })
        if (!getData) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }
        return res.status(200).send({ status: true, message: "cart details", data: getData })


    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}




const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId
        if (Object.keys(userId) == 0) {
            return res.status(400).send({ status: false, message: "userId is required" })
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }
        const cartData = await cartModel.findOne({ userId: userId })
        if (!cartData) {
            return res.status(404).send({ status: false, message: "cart not found" })
        }
        let cart = { totalItems: 0, totalPrice: 0, items: [] }
        const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, cart, { new: true })
        return res.status(204).send({ status: true, message: "cart deleted successfully", data: deleteCart })


    }
    catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}














module.exports.createCart = createCart;
module.exports.updateCart = updateCart;
module.exports.getCart = getCart;
module.exports.deleteCart = deleteCart;