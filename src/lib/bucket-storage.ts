import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

export const MANIFEST_NAME = "_manifest.json";

export type ManifestEntry = {
  name: string;
  savedAt: string;
};

type StorageDriver = {
  getText(name: string): Promise<string | null>;
  putText(name: string, content: string, contentType?: string): Promise<void>;
};

function env(name: string) {
  return process.env[name]?.trim();
}

function objectUrl(parUrl: string, name: string) {
  return `${parUrl}${encodeURIComponent(name)}`;
}

function normalizeEndpoint(endpoint: string) {
  return /^https?:\/\//i.test(endpoint) ? endpoint : `https://${endpoint}`;
}

function createParStorage(): StorageDriver {
  const parUrl = env("OCI_PAR_URL");
  if (!parUrl) {
    throw new Error("OCI_PAR_URL is required for PAR storage");
  }

  return {
    async getText(name) {
      const res = await fetch(objectUrl(parUrl, name));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to load ${name}: ${res.status}`);
      return res.text();
    },

    async putText(name, content, contentType = "text/plain; charset=utf-8") {
      const res = await fetch(objectUrl(parUrl, name), {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: content,
      });
      if (!res.ok) throw new Error(`Failed to save ${name}: ${res.status}`);
    },
  };
}

function createOciS3Storage(): StorageDriver {
  const region = env("OCI_REGION");
  const namespace = env("OCI_NAMESPACE");
  const bucket = env("OCI_BUCKET");
  const accessKeyId = env("OCI_S3_ACCESS_KEY_ID");
  const secretAccessKey = env("OCI_S3_SECRET_ACCESS_KEY");
  const endpoint =
    env("OCI_S3_ENDPOINT") ||
    (namespace && region ? `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com` : undefined);

  if (!region || !bucket || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error(
      "OCI_REGION, OCI_NAMESPACE, OCI_BUCKET, OCI_S3_ACCESS_KEY_ID, and OCI_S3_SECRET_ACCESS_KEY are required for OCI S3 storage",
    );
  }

  const client = new S3Client({
    region,
    endpoint: normalizeEndpoint(endpoint),
    forcePathStyle: true,
    requestHandler: new NodeHttpHandler({
      connectionTimeout: 5_000,
      requestTimeout: 10_000,
    }),
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return {
    async getText(name) {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: name }));
        return result.Body?.transformToString("utf-8") ?? "";
      } catch (error: any) {
        if (error instanceof NoSuchKey || error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
          return null;
        }
        throw error;
      }
    },

    async putText(name, content, contentType = "text/plain; charset=utf-8") {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: name,
          Body: content,
          ContentType: contentType,
        }),
      );
    },
  };
}

export function createBucketStorage(): StorageDriver {
  const mode = env("STORAGE_MODE") || (env("OCI_PAR_URL") ? "par" : "oci-s3");
  if (mode === "par") return createParStorage();
  if (mode === "oci-s3") return createOciS3Storage();
  throw new Error(`Unsupported STORAGE_MODE: ${mode}`);
}

export async function readManifest(storage = createBucketStorage()): Promise<ManifestEntry[]> {
  const text = await storage.getText(MANIFEST_NAME);
  if (!text) return [];
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [];
}

export async function writeManifest(entries: ManifestEntry[], storage = createBucketStorage()) {
  await storage.putText(MANIFEST_NAME, JSON.stringify(entries), "application/json; charset=utf-8");
}
