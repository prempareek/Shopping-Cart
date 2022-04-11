const userModel = require("../Models/userModel");
const jwt = require("jsonwebtoken");
const validator = require("../validator/validator")
const aws = require("../aws/aws");
const bcrypt = require("bcrypt");



const createUser = async function (req, res) {
    try {
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'No data provided' }) }

        let files = req.files;
        if (files.length == 0) { return res.status(400).send({ status: false, message: "Please provide a profile image" }) }

        //validations

        if (!(validator.isValid(data.fname))) { return res.status(400).send({ status: false, message: "First Name is required" }) }

        if (!(validator.isValid(data.lname))) { return res.status(400).send({ status: false, message: "Last Name is required" }) }

        if (!(validator.isValid(data.email))) { return res.status(400).send({ status: false, message: "Email is required" }) }

        if (!(validator.isRightFormatemail(data.email))) { return res.status(400).send({ status: false, message: "Please provide a valid email" }) }

        let isUniqueEMAIL = await userModel.findOne({ email: data.email })
        if (isUniqueEMAIL) { return res.status(400).send({ status: false, message: 'User already exist with this email. Login instead ?' }) }

        if (!(validator.isValid(data.phone))) { return res.status(400).send({ status: false, message: "Phone number is required" }) }

        if (!(validator.isRightFormatmobile(data.phone))) { return res.status(400).send({ status: false, message: "Please provide a valid phone number" }) }

        let isUniquePhone = await userModel.findOne({ phone: data.phone })
        if (isUniquePhone) { return res.status(400).send({ status: false, message: 'User already exist with this phone number.' }) }

        if (!(validator.isValid(data.password))) { return res.status(400).send({ status: false, message: "Password is required" }) }

        if (data.password.length < 8 || data.password.length > 15) { return res.status(400).send({ status: false, message: 'Password should be of minimum 8 characters & maximum 15 characters' }) }

        let address = JSON.parse(data.address)
        if (!(validator.isValid(address.shipping.street))) { return res.status(400).send({ status: true, message: " Street address is required" }) }

        if (!(validator.isValid(address.shipping.city))) { return res.status(400).send({ status: true, message: "  City is required" }) }

        if (!(validator.isValid(address.shipping.pincode))) { return res.status(400).send({ status: true, message: " Pincode is required" }) }

        if (!(validator.isValid(address.billing.street))) { return res.status(400).send({ status: true, message: " Street billing address is required" }) }

        if (!(validator.isValid(address.billing.city))) { return res.status(400).send({ status: true, message: " City billing address is required" }) }

        if (!(validator.isValid(address.billing.pincode))) { return res.status(400).send({ status: true, message: " Billing pincode is required" }) }

        //encrypting password
        const saltRounds = 10;
        hash = await bcrypt.hash(data.password, saltRounds);

        const uploadedFileURL = await aws.uploadFile(files[0])

        data.profileImage = uploadedFileURL;

        data.password = hash;

        data.address = address;

        const newUser = await userModel.create(data);

        return res.status(201).send({ status: true, message: 'success', data: newUser })


    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ message: error.message })
    }
}


const login = async function (req, res) {
    try {
        let mail = req.body.email;
        let pass = req.body.password;
        let data = req.body;
        if (Object.keys(data) == 0) { return res.status(400).send({ status: false, message: 'No data provided' }) }

        if (!(validator.isValid(mail))) { return res.status(400).send({ status: false, message: 'EMAIL is required'}) }

        if (!(validator.isRightFormatemail(mail))) { return res.status(400).send({ status: false, message: 'Please provide a valid email'})}

        if (!(validator.isValid(pass))) { return res.status(400).send({ status: false, message: 'Password is required'}) }

        if (pass.length < 8 || pass.length > 15) { return res.status(400).send({ status: false, message: 'Password should be of minimum 8 characters & maximum 15 characters' }) }

        const mailMatch = await userModel.findOne({ email: mail }).select({_id:1, password:1})
        if (!mailMatch) return res.status(400).send({ status: false, message: "Email is incorrect" })

        const userId = mailMatch._id;
        const password = mailMatch.password;

        const passMatch = await bcrypt.compare(pass, password)
        if(!passMatch) return res.status(400).send({ status: false, message: "Password is incorrect" })

        const token = jwt.sign({
            userId: mailMatch._id.toString(), iat: new Date().getTime() / 1000,
        }, "Secret-Key", { expiresIn: "30m" });

        res.setHeader("x-api-key", "token");
        return res.status(200).send({ status: true, message: "You are successfully logged in", data: userId, token })



    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ message: error.message })
    }
}


const getUser = async function (req,res){
    try{

    }
    catch (error){
        console.log(error)
        return res.status(500).send({ message: error.message })
    }
}








module.exports.createUser = createUser;
module.exports.login = login;
module.exports.getUser = getUser;