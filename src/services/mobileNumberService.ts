import UserModel from '../models/users';
import { IUser } from '../interfaces/userInterface';

// Define the response structure for the update mobile number function
interface IUpdateMobileNumberResponse {
  message: string;
}

// Function to update the mobile number
const update_mobilenumber = async (_id: string, mobilenumber: string): Promise<IUpdateMobileNumberResponse> => {
  // Step 1: Validate the mobile number format
  const isValidFormat = /^\+[1-9]\d{0,1}\d{10}$/.test(mobilenumber);

  if (!isValidFormat) {
    throw { status: 400, message: 'Invalid mobile number format' };
  }

  // Step 2: Find user by ID
  const user = await UserModel.findOne({ _id: _id });
  if (!user) {
    throw { status: 401, message: 'Invalid User' };
  }

  try {
    // Step 3: Update the user's mobile number
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $set: { mobilenumber: mobilenumber } },
      { new: true, runValidators: true } // Ensure schema validation is checked while updating the number
    );

    if (!updatedUser) {
      throw { status: 500, message: 'Failed to update mobile number' };
    }

    return { message: 'Number has been updated' };
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw { status: 400, message: 'Invalid mobile number format' };
    } else {
      console.error('Internal server error:', error); // Log the error for debugging
      throw { status: 500, message: 'An internal error has occurred' };
    }
  }
};

export { update_mobilenumber };