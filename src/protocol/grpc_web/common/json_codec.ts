/**
 * @module ModuleRpcProtocolGrpcWebCommon
 *
 * A Codec that serializes/deserializes messages to and from JSON.
 *
 * @license
 * Copyright (c) Aiden.ai
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { GrpcWebCodec } from './codec';
import { decodeUtf8, encodeUtf8 } from '../private/utf8';
import { grpc } from '@improbable-eng/grpc-web';
import { gzip, gunzip } from 'zlib'

const gzipPromise = (payload: string): Promise<Uint8Array> => {
  return new Promise ((resolve, reject) => {
    gzip(payload, (err, res) => {
      return err ? reject(err) : resolve(encodeUtf8(res.toString()))
    }) 
  })
}

const gunzipPromise = (payload: Uint8Array): Promise<string> => {
  return new Promise ((resolve, reject) => {
    gunzip(payload.toString(), (err, res) => {
      return err ? reject(err) : resolve(res.toString())
    }) 
  })
}

/**
 * Line separator between the entries of the trailer metadata (as required by
 * the gRPC-Web specification).
 */
const CLRF = '\r\n';

/**
 * A Codec that serializes/deserializes messages to and from JSON.
 */
export class GrpcWebJsonCodec implements GrpcWebCodec {
  /** @override */
  getContentType() {
    return 'application/grpc-web+json';
  }

  /** @override */
  async encodeMessage(_method: string, payload: any): Promise<Uint8Array> {
    return this.encode(payload);
  }

  /** @override */
  encodeTrailer(metadata: grpc.Metadata): Uint8Array {
    const headers: string[] = [];
    for (const key in metadata.headersMap) {
      const values = metadata.headersMap[key];
      for (const value of values) {
        const trimmedValue = value.trim();
        if (!trimmedValue) continue;
        headers.push(`${key}: ${trimmedValue}`);
      }
    }
    return encodeUtf8(headers.join(CLRF));
  }

  /** @override */
  async encodeRequest(_method: string, message: any): Promise<Uint8Array> {
    return this.encode(message);
  }

  /** @override */
  decodeRequest(_method: string, message: Uint8Array): any {
    return JSON.parse(decodeUtf8(message));
  }

  /** @override */
  decodeMessage(_method: string, encodedMessage: Uint8Array): any {
    return JSON.parse(decodeUtf8(encodedMessage));
  }

  /** @override */
  decodeTrailer(encodedTrailer: Uint8Array): grpc.Metadata {
    return new grpc.Metadata(decodeUtf8(encodedTrailer));
  }

  private encode(payload: any): Uint8Array {
    if (payload === undefined) {
      // We need to single out undefined payloads as
      // JSON.stringify(undefined) === undefined (and so it is not
      // a string that can be UTF-8 encoded).
      throw new Error("a payload cannot be 'undefined'");
    }
    return encodeUtf8(JSON.stringify(payload));
  }
}

/**
 * A Codec that serializes/deserializes messages to and from JSON,
 * using Gzip for compression.
 */
 export class GrpcWebJsonWithGzipCodec implements GrpcWebCodec {
  /** @override */
  getContentType() {
    return 'application/grpc-web+json';
  }

  // FIXME: Add getContentEncoding override

  /** @override */
  async encodeMessage(_method: string, payload: any): Promise<Uint8Array> {
    return this.encode(payload);
  }

  /** @override */
  encodeTrailer(metadata: grpc.Metadata): Uint8Array {
    const headers: string[] = [];
    for (const key in metadata.headersMap) {
      const values = metadata.headersMap[key];
      for (const value of values) {
        const trimmedValue = value.trim();
        if (!trimmedValue) continue;
        headers.push(`${key}: ${trimmedValue}`);
      }
    }
    return encodeUtf8(headers.join(CLRF));
  }

  /** @override */
  async encodeRequest(_method: string, message: any): Promise<Uint8Array> {
    return this.encode(message);
  }

  /** @override */
  async decodeRequest(_method: string, message: Uint8Array): Promise<any> {
    return JSON.parse(await gunzipPromise(message));
  }

  /** @override */
  async decodeMessage(_method: string, encodedMessage: Uint8Array): Promise<any> {
    return JSON.parse(await gunzipPromise(encodedMessage));
  }

  /** @override */
  decodeTrailer(encodedTrailer: Uint8Array): grpc.Metadata {
    return new grpc.Metadata(decodeUtf8(encodedTrailer));
  }

  private async encode(payload: any): Promise<Uint8Array> {
    if (payload === undefined) {
      // We need to single out undefined payloads as
      // JSON.stringify(undefined) === undefined (and so it is not
      // a string that can be UTF-8 encoded).
      throw new Error("a payload cannot be 'undefined'");
    }

    return gzipPromise(JSON.stringify(payload));
  }
}
