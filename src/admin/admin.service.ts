import { Injectable, Logger, Res } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/userSchema';
import { Admin } from 'src/schemas/Admin';
import axios from 'axios';
import { Response } from 'express';
import { compare, hash } from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Admin.name) private adminModel: Model<Admin>,
    private jwtService: JwtService,
  ) {}

  async API(
    res: Response<any, Record<string, any>>,
    key: string,
    email: string,
  ) {
    try {
      if (!email || key) {
        return res.status(400).json({ message: 'missing key or email' });
      }
      const response = await axios.get(
        `http://api.openweathermap.org/data/2.5/weather?q=mumbai&appid=${key}`,
      );
      if (response.data.message === 'city not found') {
        return res.status(400).json({ message: 'Invalid api key' });
      }
      if (!response.data.weather[0].description) {
        return res.status(400).json({ message: 'Invalid api key' });
      }

      const Admindata = await this.adminModel.updateOne(
        { email },
        {
          apiKey: key,
        },
      );
      if (Admindata.modifiedCount == 0) {
        return res.status(400).json({ message: 'unable to update api key' });
      }
      if (Admindata.modifiedCount > 0) {
        return res.status(200).json({ message: 'Api key updated' });
      }
    } catch (error) {
      return res.status(500).json({ message: error });
    }
  }

  async login(@Res() res: Response, email: string, password: string) {
    try {
      if (!password || !email)
        return res.status(400).json({ message: 'insufficient parameters.' });
      // console.log(req.body)
      const foundUser = await this.adminModel.findOne({ email: email });
      if (!foundUser) return res.sendStatus(401); //Unauthorized
      // check password with hash to evaluate password is correct or not
      const match = await compare(password, foundUser.password);
      // if password and email is correct then:
      if (match && foundUser.email === email && foundUser?.isVerified) {
        const roles = 5150;
        // 1. create JWTs
        const accessToken = await this.jwtService.signAsync(
          {
            UserInfo: {
              username: foundUser.username,
              email: email,
              roles: roles,
            },
          },
          { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '10h' },
        );
        // 2.create new refresh Token
        const refreshToken = await this.jwtService.signAsync(
          {
            username: foundUser.username,
            email: foundUser.email,
            roles: roles,
          },
          { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '10h' },
        );
        // 3.Saving refreshToken with current username
        foundUser.refreshToken = refreshToken;
        // const result = await foundUser.save();
        await foundUser.save();
        // console.log(result);

        res.cookie('jwt', refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000,
        });
        // Send authorization roles and access token to username
        res.json({
          roles,
          accessToken,
          refreshToken,
          success: true,
          username: foundUser.username,
        });
      } else {
        res.sendStatus(401);
      }
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  async google(@Res() res: Response, googleAccessToken: string) {
    try {
      console.log('Bearer ' + googleAccessToken);
      if (!googleAccessToken) {
        return res
          .status(400)
          .json({ message: 'insufficient agruments are required.' });
      }

      axios
        .get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${googleAccessToken}`,
          },
        })
        .then(async (response) => {
          const firstName = response.data.given_name;
          const lastName = response.data.family_name;
          const email = response.data.email;
          // const picture = response.data.picture;

          let existingUser: any = await this.adminModel.findOne({ email });

          if (!existingUser) {
            const result = await this.userModel.create({
              isVerified: true,
              email,
              username: firstName + lastName,
              socialLogin: true,
            });
            existingUser = result;
          }
          if (!existingUser.isVerified) {
            return res.status(200).json({
              message: 'Admin account created, wait for verification',
            });
          }
          const roles = 5150;
          const accessToken = await this.jwtService.signAsync(
            {
              UserInfo: {
                username: firstName + lastName,
                email: email,
                roles: roles,
              },
            },
            { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '10h' },
          );
          const refreshToken = await this.jwtService.signAsync(
            {
              username: firstName + lastName,
              email: existingUser.email,
              roles: roles,
            },
            { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '10h' },
          );

          res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 72 * 60 * 60 * 1000,
          });
          res.status(200).json({
            email: existingUser.email,
            username: existingUser.username,
            roles,
            success: true,
            accessToken: accessToken,
            message: 'Login successfully!',
          });
        })
        .catch((e) => {
          console.log(e);
          res.status(400).json({ message: 'Invalid access token!' });
        });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async register(@Res() res: Response, email: string, password: string) {
    try {
      if (!password || !email) {
        return res
          .status(400)
          .json({ message: 'insufficient agruments are required.' });
      }
      // console.log(req.body)

      // to check whether some user already exists with the given email
      const duplicate2 = await this.adminModel.findOne({ email: email });
      // if the given email or username exists with this email and password send error message
      if (duplicate2) return res.sendStatus(409); //Conflict

      // before storing into database encrypt the password
      const hashedPwd = await hash(password, 10);

      // create and store the new user details in database
      const result = await this.adminModel.create({
        email: email,
        password: hashedPwd,
      });
      // send response to the client
      res
        .status(201)
        .json({ success: true, message: `User created successfully!`, result });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
  async getUsers() {
    // Fetch all users from the database
    return await this.userModel.find({});
  }

  async deleteUser(@Res() res: Response, chatId: string) {
    try {
      const resp = await this.userModel.deleteOne({ chatId: chatId });

      if (!resp) {
        return res
          .status(400)
          .json({ message: 'Invalid user id', success: false });
      }
      if (resp.deletedCount == 0) {
        return res
          .status(400)
          .json({ message: 'user not found', success: false });
      }

      if (resp.deletedCount == 1) {
        return res.status(200).json({
          message: 'User account deleted successfully',
          success: true,
        });
      }
    } catch (error) {
      return res.status(500).json({ message: error, success: false });
    }
  }

  async deleteUsers(@Res() res: Response, ids: string[]) {
    // Delete multiple users from the database
    try {
      const resp = await this.userModel.deleteMany({ chatId: { $in: ids } });

      Logger.debug(resp);

      if (!resp) {
        return res
          .status(400)
          .json({ message: 'Invalid user id', success: false });
      }
      if (resp.deletedCount == 0) {
        return res
          .status(400)
          .json({ message: 'user not found', success: false });
      }

      if (resp.deletedCount == 1) {
        return res.status(200).json({
          message: 'User account deleted successfully',
          success: true,
        });
      }
    } catch (error) {
      return res.status(500).json({ message: error, success: false });
    }
  }

  async blockUser(@Res() res: Response, chatId: string) {
    // Block a user by setting the 'blocked' field to true
    try {
      const resp = await this.userModel.updateOne(
        { chatId: chatId },
        { blocked: true },
      );
      // Logger.debug(resp);

      if (!resp) {
        return res
          .status(400)
          .json({ message: 'Invalid user id', success: false });
      }
      if (resp.matchedCount == 0) {
        return res
          .status(400)
          .json({ message: 'user not found', success: false });
      }
      if (resp.matchedCount == 1 && resp.modifiedCount == 0) {
        return res
          .status(200)
          .json({ message: 'user is already blocked', success: false });
      }
      if (resp.matchedCount == 1 && resp.modifiedCount == 1) {
        return res
          .status(200)
          .json({ message: 'user is blocked successfully', success: true });
      }
    } catch (error) {
      return res.status(500).json({ message: error, success: false });
    }
  }
  async unblockUser(@Res() res: Response, chatId: string) {
    // Block a user by setting the 'blocked' field to true
    try {
      const resp = await this.userModel.updateOne(
        {
          chatId: chatId,
        },
        { blocked: false },
      );

      if (!resp) {
        return res
          .status(400)
          .json({ message: 'Invalid user id', success: false });
      }
      if (resp.matchedCount == 0) {
        return res
          .status(400)
          .json({ message: 'user not found', success: false });
      }
      if (resp.matchedCount == 1 && resp.modifiedCount == 0) {
        return res
          .status(200)
          .json({ message: 'user is already unblocked', success: false });
      }
      if (resp.matchedCount == 1 && resp.modifiedCount == 1) {
        return res
          .status(200)
          .json({ message: 'user is unblocked successfully', success: true });
      }
    } catch (error) {
      return res.status(500).json({ message: error, success: false });
    }
  }

  async blockUsers(@Res() res: Response, chatIds: string[]) {
    // Block multiple users by setting the 'blocked' field to true
    try {
      const resp = await this.userModel.updateMany(
        { chatId: { $in: chatIds } },
        { blocked: true },
      );

      if (!resp) {
        return res
          .status(400)
          .json({ message: 'Invalid user id', success: false });
      }

      if (
        resp.matchedCount == chatIds.length &&
        resp.modifiedCount == chatIds.length
      ) {
        res.status(200).json({
          message: 'all the given users are blocked successfully!',
          success: true,
        });
      } else {
        res.status(200).json({
          message: 'All the users may not be blocked!',
          success: false,
        });
      }
    } catch (error) {
      return res.status(500).json({ message: error, success: false });
    }
  }
}
