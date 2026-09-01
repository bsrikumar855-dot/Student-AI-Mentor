import { SerovalNode } from "seroval";
//#endregion
//#region web/abort-signal.d.ts
declare const AbortSignalPlugin: import("seroval").Plugin<AbortSignal, {
  reason?: SerovalNode;
  controller?: SerovalNode;
  factory?: SerovalNode;
}>;
//#endregion
//#region web/blob.d.ts
type BlobNode = {
  type: SerovalNode;
  buffer: SerovalNode;
};
declare const BlobPlugin: import("seroval").Plugin<Blob, BlobNode>;
//#endregion
//#region web/custom-event.d.ts
type CustomEventNode = {
  type: SerovalNode;
  options: SerovalNode;
};
declare const CustomEventPlugin: import("seroval").Plugin<CustomEvent<any>, CustomEventNode>;
//#endregion
//#region web/dom-exception.d.ts
type DOMExceptionNode = {
  name: SerovalNode;
  message: SerovalNode;
};
declare const DOMExceptionPlugin: import("seroval").Plugin<DOMException, DOMExceptionNode>;
//#endregion
//#region web/event.d.ts
type EventNode = {
  type: SerovalNode;
  options: SerovalNode;
};
declare const EventPlugin: import("seroval").Plugin<Event, EventNode>;
//#endregion
//#region web/file.d.ts
type FileNode = {
  name: SerovalNode;
  options: SerovalNode;
  buffer: SerovalNode;
};
declare const FilePlugin: import("seroval").Plugin<File, FileNode>;
//#endregion
//#region web/form-data.d.ts
type FormDataNode = {
  factory: SerovalNode;
  entries: SerovalNode;
};
declare const FormDataPlugin: import("seroval").Plugin<FormData, FormDataNode>;
//#endregion
//#region web/headers.d.ts
declare const HeadersPlugin: import("seroval").Plugin<Headers, {
  value: SerovalNode;
}>;
//#endregion
//#region web/image-data.d.ts
type ImageDataNode = {
  data: SerovalNode;
  width: SerovalNode;
  height: SerovalNode;
  options: SerovalNode;
};
declare const ImageDataPlugin: import("seroval").Plugin<ImageData, ImageDataNode>;
//#endregion
//#region web/readable-stream.d.ts
type ReadableStreamNode = {
  factory: SerovalNode;
  stream: SerovalNode;
};
declare const ReadableStreamPlugin: import("seroval").Plugin<ReadableStream<any>, ReadableStreamNode>;
//#endregion
//#region web/request.d.ts
type RequestNode = {
  url: SerovalNode;
  options: SerovalNode;
};
declare const RequestPlugin: import("seroval").Plugin<Request, RequestNode>;
//#endregion
//#region web/response.d.ts
type ResponseNode = {
  body: SerovalNode;
  options: SerovalNode;
};
declare const ResponsePlugin: import("seroval").Plugin<Response, ResponseNode>;
//#endregion
//#region web/url.d.ts
declare const URLPlugin: import("seroval").Plugin<URL, {
  value: SerovalNode;
}>;
//#endregion
//#region web/url-search-params.d.ts
declare const URLSearchParamsPlugin: import("seroval").Plugin<URLSearchParams, {
  value: SerovalNode;
}>;
declare namespace index_d_exports {
  export { AbortSignalPlugin, BlobPlugin, CustomEventPlugin, DOMExceptionPlugin, EventPlugin, FilePlugin, FormDataPlugin, HeadersPlugin, ImageDataPlugin, ReadableStreamPlugin, RequestPlugin, ResponsePlugin, URLPlugin, URLSearchParamsPlugin };
}
//#endregion
export { RequestPlugin as a, HeadersPlugin as c, EventPlugin as d, DOMExceptionPlugin as f, AbortSignalPlugin as h, ResponsePlugin as i, FormDataPlugin as l, BlobPlugin as m, URLSearchParamsPlugin as n, ReadableStreamPlugin as o, CustomEventPlugin as p, URLPlugin as r, ImageDataPlugin as s, index_d_exports as t, FilePlugin as u };