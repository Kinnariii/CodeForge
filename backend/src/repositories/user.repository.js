const User = require("../models/User");

const create = async (data) => {
    return await User.create(data);
}

const findByEmail = async (email) =>{
    return await User.findOne({email});
}

const findById = async (id) => {
    return await User.findById(id).select("-password");
}

const updateProfile = async (id, data) => {
    return await User.findByIdAndUpdate(id, data, {
        returnDocument: 'after',
        runValidators: true
    }).select("-password");
}

const updatePassword = async (id, hashPassword) => {
    return await User.findByIdAndUpdate(id, {password: hashPassword}, { returnDocument: 'after' });
}

module.exports = {
    create, findByEmail, findById, updateProfile, updatePassword
}