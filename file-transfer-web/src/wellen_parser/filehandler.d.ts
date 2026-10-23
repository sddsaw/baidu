import * as $wcm from '@vscode/wasm-component-model';
import type { u32, u64, s32, float64, i32, i64, f64, ptr } from '@vscode/wasm-component-model';
export declare namespace Types {
    type Scopeitem = {
        name: string;
        id: string;
        tpe: string;
    };
}
export type Types = {};
export declare namespace filehandler {
    type Scopeitem = Types.Scopeitem;
    type Imports = {
        log: (msg: string) => void;
        outputlog: (msg: string) => void;
        /**
         * Zero-copy file read: the Worker thread handles this locally without IPC.
         * For local files it calls fs.readSync; for workspace/virtual-FS files it reads
         * from a pre-loaded in-memory buffer sent via a setup-file message before loadfile.
         * `ptr` is a raw WASM linear-memory address; the host writes `length` bytes there
         * and returns the number of bytes actually written.
         */
        fsreadptr: (fd: u32, offset: u64, ptr: u32, length: u32) => u32;
        getsize: (fd: u32) => u64;
        setscopetop: (name: string, id: u32, tpe: string) => void;
        setvartop: (name: string, id: u32, signalid: u32, tpe: string, encoding: string, width: u32, msb: s32, lsb: s32, enumtype: string) => void;
        setmetadata: (scopecount: u32, varcount: u32, timescale: u32, timeunit: string) => void;
        setchunksize: (chunksize: u64, timeend: u64, timetablelength: u64) => void;
        sendtransitiondatachunk: (signalid: u32, totalchunks: u32, chunknum: u32, min: float64, max: float64, data: string) => void;
        sendenumdata: (name: string, totalchunks: u32, chunknum: u32, data: string) => void;
        sendcompressedtransitiondata: (signalid: u32, signalwidth: u32, totalchunks: u32, chunknum: u32, min: float64, max: float64, compresseddata: Uint8Array, originalsize: u32) => void;
    };
    namespace Imports {
        type Promisified = $wcm.$imports.Promisify<Imports>;
    }
    namespace imports {
        type Promisify<T> = $wcm.$imports.Promisify<T>;
    }
    type Exports = {
        loadfile: (size: u64, fd: u32, loadstatic: boolean, buffersize: u32) => void;
        readbody: () => void;
        unload: () => void;
        /**
         * wit2ts seems to have issues returning lists of custom types
         * so we will convert to JSON string
         */
        getparametervalues: (signalidlist: Uint32Array) => string;
        getchildren: (id: u32, startindex: u32) => string;
        getsignaldata: (signalidlist: Uint32Array) => void;
        getenumdata: (netlistidlist: Uint32Array) => void;
        getvaluesattime: (time: u64, paths: string) => string;
        searchnetlist: (searchquery: string, scopeid: u32) => string;
        loadremotestatus: (status: Uint8Array) => string;
        loadremotechunk: (chunkType: u32, chunkData: Uint8Array, chunkIndex: u32, totalChunks: u32) => void;
    };
    namespace Exports {
        type Promisified = $wcm.$exports.Promisify<Exports>;
    }
    namespace exports {
        type Promisify<T> = $wcm.$exports.Promisify<T>;
    }
}
export declare namespace Types.$ {
    const Scopeitem: $wcm.RecordType<Scopeitem>;
}
export declare namespace Types._ {
    const id: "vaporview:fileparser/types";
    const witName: "types";
    const types: Map<string, $wcm.AnyComponentModelType>;
    type WasmInterface = {};
}
export declare namespace filehandler.$ {
    const Scopeitem: $wcm.RecordType<Types.Scopeitem>;
    namespace imports {
        const log: $wcm.FunctionType<(msg: string) => void>;
        const outputlog: $wcm.FunctionType<(msg: string) => void>;
        const fsreadptr: $wcm.FunctionType<(fd: u32, offset: u64, ptr: u32, length: u32) => u32>;
        const getsize: $wcm.FunctionType<(fd: u32) => u64>;
        const setscopetop: $wcm.FunctionType<(name: string, id: u32, tpe: string) => void>;
        const setvartop: $wcm.FunctionType<(name: string, id: u32, signalid: u32, tpe: string, encoding: string, width: u32, msb: s32, lsb: s32, enumtype: string) => void>;
        const setmetadata: $wcm.FunctionType<(scopecount: u32, varcount: u32, timescale: u32, timeunit: string) => void>;
        const setchunksize: $wcm.FunctionType<(chunksize: u64, timeend: u64, timetablelength: u64) => void>;
        const sendtransitiondatachunk: $wcm.FunctionType<(signalid: u32, totalchunks: u32, chunknum: u32, min: float64, max: float64, data: string) => void>;
        const sendenumdata: $wcm.FunctionType<(name: string, totalchunks: u32, chunknum: u32, data: string) => void>;
        const sendcompressedtransitiondata: $wcm.FunctionType<(signalid: u32, signalwidth: u32, totalchunks: u32, chunknum: u32, min: float64, max: float64, compresseddata: Uint8Array, originalsize: u32) => void>;
    }
    namespace exports {
        const loadfile: $wcm.FunctionType<(size: u64, fd: u32, loadstatic: boolean, buffersize: u32) => void>;
        const readbody: $wcm.FunctionType<() => void>;
        const unload: $wcm.FunctionType<() => void>;
        const getparametervalues: $wcm.FunctionType<(signalidlist: Uint32Array) => string>;
        const getchildren: $wcm.FunctionType<(id: u32, startindex: u32) => string>;
        const getsignaldata: $wcm.FunctionType<(signalidlist: Uint32Array) => void>;
        const getenumdata: $wcm.FunctionType<(netlistidlist: Uint32Array) => void>;
        const getvaluesattime: $wcm.FunctionType<(time: u64, paths: string) => string>;
        const searchnetlist: $wcm.FunctionType<(searchquery: string, scopeid: u32) => string>;
        const loadremotestatus: $wcm.FunctionType<(status: Uint8Array) => string>;
        const loadremotechunk: $wcm.FunctionType<(chunkType: u32, chunkData: Uint8Array, chunkIndex: u32, totalChunks: u32) => void>;
    }
}
export declare namespace filehandler._ {
    const id: "vaporview:fileparser/filehandler";
    const witName: "filehandler";
    type $Root = {
        'log': (msg_ptr: i32, msg_len: i32) => void;
        'outputlog': (msg_ptr: i32, msg_len: i32) => void;
        'fsreadptr': (fd: i32, offset: i64, ptr: i32, length: i32) => i32;
        'getsize': (fd: i32) => i64;
        'setscopetop': (name_ptr: i32, name_len: i32, id: i32, tpe_ptr: i32, tpe_len: i32) => void;
        'setvartop': (name_ptr: i32, name_len: i32, id: i32, signalid: i32, tpe_ptr: i32, tpe_len: i32, encoding_ptr: i32, encoding_len: i32, width: i32, msb: i32, lsb: i32, enumtype_ptr: i32, enumtype_len: i32) => void;
        'setmetadata': (scopecount: i32, varcount: i32, timescale: i32, timeunit_ptr: i32, timeunit_len: i32) => void;
        'setchunksize': (chunksize: i64, timeend: i64, timetablelength: i64) => void;
        'sendtransitiondatachunk': (signalid: i32, totalchunks: i32, chunknum: i32, min: f64, max: f64, data_ptr: i32, data_len: i32) => void;
        'sendenumdata': (name_ptr: i32, name_len: i32, totalchunks: i32, chunknum: i32, data_ptr: i32, data_len: i32) => void;
        'sendcompressedtransitiondata': (signalid: i32, signalwidth: i32, totalchunks: i32, chunknum: i32, min: f64, max: f64, compresseddata_ptr: i32, compresseddata_len: i32, originalsize: i32) => void;
    };
    namespace imports {
        const functions: Map<string, $wcm.FunctionType>;
        const interfaces: Map<string, $wcm.InterfaceType>;
        function create(service: filehandler.Imports, context: $wcm.WasmContext): Imports;
        function loop(service: filehandler.Imports, context: $wcm.WasmContext): filehandler.Imports;
    }
    type Imports = {
        '$root': $Root;
    };
    namespace exports {
        const functions: Map<string, $wcm.FunctionType>;
        function bind(exports: Exports, context: $wcm.WasmContext): filehandler.Exports;
    }
    type Exports = {
        'loadfile': (size: i64, fd: i32, loadstatic: i32, buffersize: i32) => void;
        'readbody': () => void;
        'unload': () => void;
        'getparametervalues': (signalidlist_ptr: i32, signalidlist_len: i32, result: ptr<string>) => void;
        'getchildren': (id: i32, startindex: i32, result: ptr<string>) => void;
        'getsignaldata': (signalidlist_ptr: i32, signalidlist_len: i32) => void;
        'getenumdata': (netlistidlist_ptr: i32, netlistidlist_len: i32) => void;
        'getvaluesattime': (time: i64, paths_ptr: i32, paths_len: i32, result: ptr<string>) => void;
        'searchnetlist': (searchquery_ptr: i32, searchquery_len: i32, scopeid: i32, result: ptr<string>) => void;
        'loadremotestatus': (status_ptr: i32, status_len: i32, result: ptr<string>) => void;
        'loadremotechunk': (chunkType: i32, chunkData_ptr: i32, chunkData_len: i32, chunkIndex: i32, totalChunks: i32) => void;
    };
    function bind(service: filehandler.Imports, code: $wcm.Code, context?: $wcm.ComponentModelContext): Promise<filehandler.Exports>;
    function bind(service: filehandler.Imports.Promisified, code: $wcm.Code, port: $wcm.RAL.ConnectionPort, context?: $wcm.ComponentModelContext): Promise<filehandler.Exports.Promisified>;
}
//# sourceMappingURL=filehandler.d.ts.map