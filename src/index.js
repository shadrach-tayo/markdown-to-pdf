"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const express_1 = __importDefault(require("express"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const helmet_1 = __importDefault(require("helmet"));
const path_1 = require("path");
const app = (0, express_1.default)();
const port = process.env.PORT || 8201;
// Middleware to parse JSON bodies
app.use(express_1.default.json());
// Security middleware
app.use((0, helmet_1.default)());
// Body parser middleware
app.use(express_1.default.json({ limit: "100mb" }));
app.use(express_1.default.urlencoded({ extended: false }));
// PDF generation endpoint
app.post("/generate-pdf", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, content } = req.body;
        if (!id || !content) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        // Create temporary file paths
        const tmpDir = (0, path_1.join)(process.cwd(), "tmp");
        yield Promise.resolve().then(() => __importStar(require("fs/promises"))).then((fs) => fs.mkdir(tmpDir, { recursive: true }));
        const mdPath = (0, path_1.join)(tmpDir, `${id}.md`);
        const pdfPath = (0, path_1.join)(tmpDir, `${id}.pdf`);
        // Save markdown content to temporary file
        yield (0, promises_1.writeFile)(mdPath, content);
        console.log("[convert pdf]", { baseDir: process.cwd(), mdPath, pdfPath });
        let dir = (0, child_process_1.execSync)(`md-to-pdf ${mdPath}`);
        if ((0, fs_1.existsSync)(pdfPath)) {
            res.status(200);
            // res.setHeader("Content-Type", mime.getType(pdfPath)!);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `attachment; filename=${id}`);
            const stream = (0, fs_1.createReadStream)(pdfPath);
            return stream.pipe(res);
        }
        else {
            res.status(400).json({ message: "Cannot find generated pdf file" });
        }
        // Clean up temporary files
        yield Promise.all([(0, promises_1.unlink)(mdPath), (0, promises_1.unlink)(pdfPath)]);
    }
    catch (error) {
        console.error("Error generating PDF:", error);
        return res.status(500).json({ error: "Failed to generate PDF" });
    }
}));
// Start the server
const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('SIGTERM signal received: gracefully shutting down');
    if (server) {
        server.close(() => {
            console.log('HTTP server closed');
        });
    }
}));
