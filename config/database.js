import mongoose from 'mongoose';
const connectDB = async () => {
  (await mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log('MongoDB connected successfully');
  }).catch((error)=>{
    console.error('MongoDB connection failed:', error.message);
  }));
}
export default connectDB;