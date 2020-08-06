import mongoose, { Schema } from 'mongoose';
import { Password } from '../services/password';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';

// Types
interface UserAttrs {
  email: string;
  password: string;
  accountName?: string;
  realName?: string;
  mobile?: string;
  telephone?: string;
  address?: string;
  recipients?: [
    {
      name: string;
      mobile: string;
      telephone?: string;
      address: string;
    }
  ];
  cart?: {
    items: [
      {
        productId: string;
        quantity: number;
      }
    ];
  };
}

interface UserDoc extends mongoose.Document {
  version: number;
  email: string;
  password: string;
  accountName?: string;
  realName?: string;
  mobile?: string;
  telephone?: string;
  address?: string;
  recipients?: [
    {
      name: string;
      mobile: string;
      telephone?: string;
      address: string;
    }
  ];
  cart?: {
    items: [
      {
        productId: string;
        quantity: number;
      }
    ];
  };
  createdAt: string;
  updatedAt: string;
}

interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
  addToCart(productId: string): void;
}

// Schema
const RecipientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  telephone: {
    type: String,
    required: false,
  },
  address: {
    type: String,
    required: true,
  },
});

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
      required: false,
    },
    realName: {
      type: String,
      required: false,
    },
    mobile: {
      type: String,
      required: false,
    },
    telephone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    recipients: {
      type: [RecipientSchema],
    },
    cart: {
      items: {
        type: [cartItemSchema],
      },
    },
  },
  {
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
    timestamps: true,
  }
);

// Optimistic Concurrency Control
userSchema.set('versionKey', 'version');
userSchema.plugin(updateIfCurrentPlugin);

// Define the Pre middleware for Save event
// Hash the password
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const hashedPassword = await Password.toHash(this.get('password'));
    this.set('password', hashedPassword);
  }

  next();
});

// Custom Methods - Model
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

// Custom Methods - Instance
userSchema.methods.addToCart = async function (productId: string) {
  let newQty = 1;

  const cartProductIndex = this.cart.items.findIndex(
    (cartItem: { productId: string }) => {
      return cartItem.productId.toString() === productId;
    }
  );
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQty = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQty;
  } else {
    updatedCartItems.push({
      productId: new mongoose.Types.ObjectId(productId),
      quantity: newQty,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  return await this.save();
};

userSchema.methods.removeFromCart = async function (productId: string) {
  const updatedCartItems = this.cart.items.filter(
    (cartItem: { productId: string }) => {
      return cartItem.productId.toString() !== productId;
    }
  );
  this.cart.items = updatedCartItems;
  return await this.save();
};

userSchema.methods.clearCart = async function () {
  this.cart = { items: [] };
  return await this.save();
};

// Model
const User = mongoose.model<UserDoc, UserModel>('User', userSchema);

export { User };
