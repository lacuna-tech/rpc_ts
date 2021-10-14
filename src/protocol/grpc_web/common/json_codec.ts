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
import { gzip, ungzip } from 'pako';
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
  encodeMessage(_method: string, payload: any): Uint8Array {
    return this.encode(payload);
  }

  /** @override */
  getContentEncoding() {
    return undefined;
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
  encodeRequest(_method: string, message: any): Uint8Array {
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
 * using gzip for compression.
 */
 export class GrpcWebJsonWithGzipCodec implements GrpcWebCodec {
  /** @override */
  getContentType() {
    return 'application/grpc-web+json';
  }

  /** @override */
  getContentEncoding() {
    return 'gzip';
  }

  /** @override */
  encodeMessage(_method: string, payload: any): Uint8Array {
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
  encodeRequest(_method: string, message: any): Uint8Array {
    return this.encode(message);
  }

  /** @override */
  decodeRequest(_method: string, message: Uint8Array): any {
    return JSON.parse(ungzip(message, { to: 'string' }));
  }

  /** @override */
  decodeMessage(_method: string, encodedMessage: Uint8Array): any {
    return JSON.parse(ungzip(encodedMessage, { to: 'string' }));
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
    return gzip(JSON.stringify(payload));
  }
}
