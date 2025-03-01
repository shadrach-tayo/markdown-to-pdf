import { execSync } from "child_process";
import express, { Request, Response } from "express";
import { createReadStream, existsSync } from "fs";
import { unlink, writeFile } from "fs/promises";
import helmet from "helmet";
import { join } from "path";
import mdToPdf from "md-to-pdf";

const app = express();
const port = process.env.PORT || 8000;

// Middleware to parse JSON bodies
app.use(express.json());

// Security middleware
app.use(helmet());

// Body parser middleware
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: false }));

// Interface for the request body
interface GeneratePdfRequest {
  id: string;
  content: string;
}

// PDF generation endpoint
app.post(
  "/generate-pdf",
  async (req: Request<{}, {}, GeneratePdfRequest>, res: Response) => {
    try {
      const { id, content } = req.body;

      if (!id || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create temporary file paths
      const tmpDir = join(process.cwd(), "tmp");
      await import("fs/promises").then((fs) =>
        fs.mkdir(tmpDir, { recursive: true })
      );
      const mdPath = join(tmpDir, `${id}.md`);
      const pdfPath = join(tmpDir, `${id}.pdf`);

      // Save markdown content to temporary file
      await writeFile(mdPath, content!);

      console.log("[convert pdf]", { baseDir: process.cwd(), mdPath, pdfPath });

      let dir = execSync(`md-to-pdf ${mdPath}`);

      if (existsSync(pdfPath)) {
        res.status(200);
        // res.setHeader("Content-Type", mime.getType(pdfPath)!);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${id}`);
        const stream = createReadStream(pdfPath);
        return stream.pipe(res);
      } else {
        res.status(400).json({ message: "Cannot find generated pdf file" });
      }

      // Clean up temporary files
        await Promise.all([unlink(mdPath), unlink(pdfPath)]);

    } catch (error) {
      console.error("Error generating PDF:", error);
      return res.status(500).json({ error: "Failed to generate PDF" });
    }
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
