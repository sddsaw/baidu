/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/ban-types */
import * as $wcm from '@vscode/wasm-component-model';

export namespace Types {
    export type Scopeitem = {
        name: string;
        id: string;
        tpe: string;
    };
    export namespace $ {
        export const Scopeitem = new $wcm.RecordType([
            ['name', $wcm.wstring],
            ['id', $wcm.wstring],
            ['tpe', $wcm.wstring],
        ]);
    }
    export namespace _ {
        export const id = 'vaporview:fileparser/types' as const;
        export const witName = 'types' as const;
        export const types = new Map<string, any>([
            ['Scopeitem', $.Scopeitem]
        ]);
    }
}

export namespace filehandler {
    export type Scopeitem = Types.Scopeitem;
    export type Imports = {
        log: (msg: string) => void;
        outputlog: (msg: string) => void;
        fsreadptr: (fd: number, offset: bigint, ptr: number, length: number) => number;
        getsize: (fd: number) => bigint;
        setscopetop: (name: string, id: number, tpe: string) => void;
        setvartop: (name: string, id: number, signalid: number, tpe: string, encoding: string, width: number, msb: number, lsb: number, enumtype: string) => void;
        setmetadata: (scopecount: number, varcount: number, timescale: number, timeunit: string) => void;
        setchunksize: (chunksize: bigint, timeend: bigint, timetablelength: bigint) => void;
        sendtransitiondatachunk: (signalid: number, totalchunks: number, chunknum: number, min: number, max: number, data: string) => void;
        sendenumdata: (name: string, totalchunks: number, chunknum: number, data: string) => void;
        sendcompressedtransitiondata: (signalid: number, signalwidth: number, totalchunks: number, chunknum: number, min: number, max: number, compresseddata: Uint8Array, originalsize: number) => void;
    };
    export type Exports = {
        loadfile: (size: bigint, fd: number, loadstatic: boolean, buffersize: number) => void;
        readbody: () => void;
        unload: () => void;
        getparametervalues: (signalidlist: Uint32Array) => string;
        getchildren: (id: number, startindex: number) => string;
        getsignaldata: (signalidlist: Uint32Array) => void;
        getenumdata: (netlistidlist: Uint32Array) => void;
        getvaluesattime: (time: bigint, paths: string) => string;
        searchnetlist: (searchquery: string, scopeid: number) => string;
        loadremotestatus: (status: Uint8Array) => string;
        loadremotechunk: (chunkType: number, chunkData: Uint8Array, chunkIndex: number, totalChunks: number) => void;
    };

    export namespace $ {
        export const Scopeitem = Types.$.Scopeitem;
        export namespace imports {
            export const log = new $wcm.FunctionType('log', [
                ['msg', $wcm.wstring],
            ], undefined);
            export const outputlog = new $wcm.FunctionType('outputlog', [
                ['msg', $wcm.wstring],
            ], undefined);
            export const fsreadptr = new $wcm.FunctionType('fsreadptr', [
                ['fd', $wcm.u32],
                ['offset', $wcm.u64],
                ['ptr', $wcm.u32],
                ['length', $wcm.u32],
            ], $wcm.u32);
            export const getsize = new $wcm.FunctionType('getsize', [
                ['fd', $wcm.u32],
            ], $wcm.u64);
            export const setscopetop = new $wcm.FunctionType('setscopetop', [
                ['name', $wcm.wstring],
                ['id', $wcm.u32],
                ['tpe', $wcm.wstring],
            ], undefined);
            export const setvartop = new $wcm.FunctionType('setvartop', [
                ['name', $wcm.wstring],
                ['id', $wcm.u32],
                ['signalid', $wcm.u32],
                ['tpe', $wcm.wstring],
                ['encoding', $wcm.wstring],
                ['width', $wcm.u32],
                ['msb', $wcm.s32],
                ['lsb', $wcm.s32],
                ['enumtype', $wcm.wstring],
            ], undefined);
            export const setmetadata = new $wcm.FunctionType('setmetadata', [
                ['scopecount', $wcm.u32],
                ['varcount', $wcm.u32],
                ['timescale', $wcm.u32],
                ['timeunit', $wcm.wstring],
            ], undefined);
            export const setchunksize = new $wcm.FunctionType('setchunksize', [
                ['chunksize', $wcm.u64],
                ['timeend', $wcm.u64],
                ['timetablelength', $wcm.u64],
            ], undefined);
            export const sendtransitiondatachunk = new $wcm.FunctionType('sendtransitiondatachunk', [
                ['signalid', $wcm.u32],
                ['totalchunks', $wcm.u32],
                ['chunknum', $wcm.u32],
                ['min', $wcm.float64],
                ['max', $wcm.float64],
                ['data', $wcm.wstring],
            ], undefined);
            export const sendenumdata = new $wcm.FunctionType('sendenumdata', [
                ['name', $wcm.wstring],
                ['totalchunks', $wcm.u32],
                ['chunknum', $wcm.u32],
                ['data', $wcm.wstring],
            ], undefined);
            export const sendcompressedtransitiondata = new $wcm.FunctionType('sendcompressedtransitiondata', [
                ['signalid', $wcm.u32],
                ['signalwidth', $wcm.u32],
                ['totalchunks', $wcm.u32],
                ['chunknum', $wcm.u32],
                ['min', $wcm.float64],
                ['max', $wcm.float64],
                ['compresseddata', new $wcm.Uint8ArrayType()],
                ['originalsize', $wcm.u32],
            ], undefined);
        }
        export namespace exports {
            export const loadfile = new $wcm.FunctionType('loadfile', [
                ['size', $wcm.u64],
                ['fd', $wcm.u32],
                ['loadstatic', $wcm.bool],
                ['buffersize', $wcm.u32],
            ], undefined);
            export const readbody = new $wcm.FunctionType('readbody', [], undefined);
            export const unload = new $wcm.FunctionType('unload', [], undefined);
            export const getparametervalues = new $wcm.FunctionType('getparametervalues', [
                ['signalidlist', new $wcm.Uint32ArrayType()],
            ], $wcm.wstring);
            export const getchildren = new $wcm.FunctionType('getchildren', [
                ['id', $wcm.u32],
                ['startindex', $wcm.u32],
            ], $wcm.wstring);
            export const getsignaldata = new $wcm.FunctionType('getsignaldata', [
                ['signalidlist', new $wcm.Uint32ArrayType()],
            ], undefined);
            export const getenumdata = new $wcm.FunctionType('getenumdata', [
                ['netlistidlist', new $wcm.Uint32ArrayType()],
            ], undefined);
            export const getvaluesattime = new $wcm.FunctionType('getvaluesattime', [
                ['time', $wcm.u64],
                ['paths', $wcm.wstring],
            ], $wcm.wstring);
            export const searchnetlist = new $wcm.FunctionType('searchnetlist', [
                ['searchquery', $wcm.wstring],
                ['scopeid', $wcm.u32],
            ], $wcm.wstring);
            export const loadremotestatus = new $wcm.FunctionType('loadremotestatus', [
                ['status', new $wcm.Uint8ArrayType()],
            ], $wcm.wstring);
            export const loadremotechunk = new $wcm.FunctionType('loadremotechunk', [
                ['chunkType', $wcm.u32],
                ['chunkData', new $wcm.Uint8ArrayType()],
                ['chunkIndex', $wcm.u32],
                ['totalChunks', $wcm.u32],
            ], undefined);
        }
    }
    export namespace _ {
        export const id = 'vaporview:fileparser/filehandler' as const;
        export const witName = 'filehandler' as const;
        export namespace imports {
            export const functions = new Map<string, $wcm.FunctionType>([
                ['log', $.imports.log],
                ['outputlog', $.imports.outputlog],
                ['fsreadptr', $.imports.fsreadptr],
                ['getsize', $.imports.getsize],
                ['setscopetop', $.imports.setscopetop],
                ['setvartop', $.imports.setvartop],
                ['setmetadata', $.imports.setmetadata],
                ['setchunksize', $.imports.setchunksize],
                ['sendtransitiondatachunk', $.imports.sendtransitiondatachunk],
                ['sendenumdata', $.imports.sendenumdata],
                ['sendcompressedtransitiondata', $.imports.sendcompressedtransitiondata]
            ]);
            export const interfaces = new Map<string, any>([
                ['Types', Types._]
            ]);
            export function create(service: any, context: any) {
                return ($wcm.$imports as any).create(_, service, context);
            }
            export function loop(service: any, context: any) {
                return ($wcm.$imports as any).loop(_, service, context);
            }
        }
        export namespace exports {
            export const functions = new Map<string, $wcm.FunctionType>([
                ['loadfile', $.exports.loadfile],
                ['readbody', $.exports.readbody],
                ['unload', $.exports.unload],
                ['getparametervalues', $.exports.getparametervalues],
                ['getchildren', $.exports.getchildren],
                ['getsignaldata', $.exports.getsignaldata],
                ['getenumdata', $.exports.getenumdata],
                ['getvaluesattime', $.exports.getvaluesattime],
                ['searchnetlist', $.exports.searchnetlist],
                ['loadremotestatus', $.exports.loadremotestatus],
                ['loadremotechunk', $.exports.loadremotechunk]
            ]);
            export function bind(exports: any, context: any) {
                return ($wcm.$exports as any).bind(_, exports, context);
            }
        }
        export function bind(service: any, code: any, portOrContext?: any, context?: any) {
            return ($wcm.$main as any).bind(_, service, code, portOrContext, context);
        }
    }
}
