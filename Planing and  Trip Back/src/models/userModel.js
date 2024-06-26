const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

        lastname: {
            type: String
        },
        age: {
            type: Number
        },

        name: {
            type: String,
            trim: true,
            required: [true, 'Please tell us your name!'],
        },
        phonenumber: {
            type: Number,
            unique: true,
            required: [true, 'Tu dois entrer votre numéro'],
            minlength: 10,
            validate: {
                validator: function (el) {
                    console.log(el.toString().length);
                    return el.toString().length > 10;
                },
                message: 'Tu dois entrer 10 chiffre pour le numéro de téléphone',
            },
        },
        email: {
            type: String,
            required: [true, 'Tu dois entrer votre email'],
            unique: true,
            lowercase: true,
            trim: true,
            validate: [validator.isEmail, 'Tu dois entrer votre email'],
        },
        photo: {
            type: String,
            default: 'default.jpg',
        },
        address: {
            type: String,
        },
        datedenaissance: {
            type: Date,
        },


        role: {
            type: String,
            enum: ['ROLE_CLIENT', 'ROLE_ADMIN'],
            default: 'user',
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 8,
            select: false,
        },
        passwordConfirm: {
            type: String,
            required: [true, 'Please confirm your password'],
            validate: {
                // This only works on CREATE and SAVE!!!
                validator: function (el) {
                    return el === this.password;
                },
                message: 'Passwords are not the same!',
            },
        },
        passwordChangedAt: Date,
        passwordResetToken: String,
        passwordResetExpires: Date,
        active: {
            type: Boolean,
            default: true,
        },
        createdAt: {
            type: Date,
            default: Date.now(),
            select: false,
        },
    },
    {
        toJSON: {virtuals: true},
        toObject: {virtuals: true}
    }
)
userSchema.pre('save', async function (next) {
    // Only run this function if password was actually modified
    if (!this.isModified('password')) return next();

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// userSchema.pre(/^find/, function(next) {
//   // this points to the current query
//   this.find({ active: { $ne: false } });
//   next();
// });

userSchema.methods.correctPassword = async function (
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(2).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.methods.createTokenInscription = function () {
    const resetToken = crypto.randomBytes(4).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // console.log({ resetToken }, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
