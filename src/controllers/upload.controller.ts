import { Request, Response } from "express";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import { authMiddleware, upload } from "../middlewares";
import { BaseController } from "../core";
import { s3 } from "../config";

export class UploadController extends BaseController {
  protected registerRoutes(): void {
    this.router.post(
      "/file",
      authMiddleware,
      upload.single("file"),
      this.uploadFile
    );
    this.router.post(
      "/files",
      authMiddleware,
      upload.array("files"),
      this.uploadFiles
    );
    this.router.post("/delete", authMiddleware, this.deleteFile);
  }

  private getDownloadURL = (key: string) => {
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  };

  uploadFile = async (req: Request, res: Response) => {
    const file = req.file;
    const { path } = req.body;
    if (!file) {
      res.status(400).json({ success: false, msg: "No file uploaded" });
      return;
    }

    const ext = file.originalname.split(".").pop();
    const key = `${path}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    res
      .status(201)
      .json({ success: true, data: { url: this.getDownloadURL(key), key } });
  };

  uploadFiles = async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    const { path } = req.body;

    if (!files || files.length === 0) {
      res.status(400).json({ error: "No files uploaded" });
      return;
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        const fileId = uuidv4();
        const ext = file.originalname.split(".").pop();
        const key = `${path}/${fileId}.${ext}`;

        const command = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        });

        await s3.send(command);

        return { key, url: this.getDownloadURL(key) };
      })
    );

    res.status(201).json({ success: true, data: uploadResults });
  };

  deleteFile = async (req: Request, res: Response) => {
    const { key } = req.body;
    if (!key) {
      res.status(400).json({ error: "Missing file key" });
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
    });

    await s3.send(command);

    res.json({ success: true, data: null });
  };
}
