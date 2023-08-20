import { Resvg } from '@resvg/resvg-js'
import * as crypto from 'crypto';
import * as path from 'path';
import * as fsutils from 'fs';
import { promises as fs } from 'fs';
import _ from 'lodash';
import { createRequire } from 'node:module';
import { Logger } from './logger.js';

const require = createRequire(import.meta.url);
const Config = require('../../config/config.json');

export interface FoundryConfig {
    readonly baseUrl: string;
    readonly basePath: string;
    readonly actors: string;
    readonly owners: Record<string, string>; // Discord ID -> Actor ID
}

interface FoundryStats {
    systemId: string;
    systemVersion?: string;
    coreVersion?: string;
    modifiedTime?: number;
}

class Roll {
    readonly dice: number[];
    readonly modififers: Record<string, number>;

    constructor(dice: number[], modififers?: Record<string, number>) {
        this.dice = dice;
        this.modififers = modififers ?? {};
    }

    get value(): number {
        return _.sum(this.dice) + _.sum(Object.values(this.modififers));
    }

    toString(): string {
        const modifiers = _.map(this.modififers, (value, desc) => `${value} (${desc})`);
        return this.dice.map(die => `<${die}>`).concat(modifiers).join(' + ');
    }

    static rollDice(size: number, quantity?: number): number[] {
        const rolls = _.range(quantity ?? 1).map(i => crypto.randomInt(size));
        return rolls.map(i => i + 1);
    }
}

export interface FoundryModel {
    _id: string;
    _stats: FoundryStats;
    name: string;
    type: string;
    img: string;
    system: unknown;
    flags: unknown;
    thumbnail?: string;
}

function createModelCollection<T extends FoundryModel>(models: T[]): Map<string, T> {
    return new Map(models.map(model => [model._id, model]));
}

interface FoundryRollable extends FoundryModel {
    roll(modifiers?: Record<string, number>): Roll;
}
export interface FoundryActor extends FoundryModel {
    items: FoundryModel[];
    skills?: Map<string, FoundryRollable>;
    isPlayerCharacter: boolean;
}

function isCprModel(model: FoundryModel): model is CprModel {
    return model._stats.systemId === 'cyberpunk-red-core';
}

interface CprModel extends FoundryModel {
    _stats: {
        systemId: 'cyberpunk-red-core'
    }
}

export enum CprStat {
    INT = "int",
    REF = "ref",
    DEX = "dex",
    TECH = "tech",
    COOL = "cool",
    WILL = "will",
    LUCK = "luck",
    MOVE = "move",
    BODY = "body",
    EMP = "emp",
}

export interface ICprSkill extends FoundryModel {
    type: "skill",
    system: {
        level: number,
        stat: CprStat,
        category: string
    }
}

export interface CprSkill extends ICprSkill {}
export class CprSkill implements ICprSkill, FoundryRollable {
    private readonly statValue: number;

    constructor(skill: ICprSkill, stat: number) {
        Object.assign(this, skill);
        this.statValue = stat;
    }

    public roll(modifiers: Record<string, number>) {
        const dice = Roll.rollDice(10);
        if (dice[0] === 1) {
            dice.push(-Roll.rollDice(10)[0]);
        } else if (dice[0] === 10) {
            dice.push(Roll.rollDice(10)[0]);
        }
        const base = this.system.level + this.statValue;
        return new Roll(dice, { ...modifiers, 'skill base': base });
    }

    static isSkill(item: FoundryModel): item is ICprSkill {
        return isCprModel(item) && item.type === 'skill';
    }
}

export interface ICprWeapon extends FoundryModel {
    type: "weapon",
    system: {
        // TODO
    }
}

type ICprItem = ICprSkill | ICprWeapon;

export interface ICprActor extends FoundryActor {
    system: {
        stats: Record<CprStat, { value: number }>
    },
    items: FoundryModel[];
}

enum CprActorType {
    CHARACTER = 'character',
    MOOK = 'mook',
}

export interface CprActor extends ICprActor {}
export class CprActor {
    readonly skills: Map<string, CprSkill>;

    constructor(actor: FoundryActor) {
        Object.assign(this, actor);
        this.skills = createModelCollection(
            this.items.filter(CprSkill.isSkill)
                .map(item => this.createSkill(item))
        );
    }

    get isPlayerCharacter(): boolean {
        return this.type === CprActorType.CHARACTER;
    }

    private createSkill(skill: ICprSkill): CprSkill {
        const stat = this.system.stats[skill.system.stat].value;
        return new CprSkill(skill, stat);
    }

    static isActor(model: FoundryModel): model is ICprActor {
        return isCprModel(model) && Object.values(CprActorType).includes(model.type as CprActorType);
    }

    static isCharacter(model: FoundryModel): model is ICprActor {
        return isCprModel(model) && model.type === CprActorType.CHARACTER;
    }
}

async function convertSvg(source: string, destination: string): Promise<void> {
    const sourceData = await fs.readFile(source);
    const resvg = new Resvg(sourceData);
    const rendered = resvg.render();
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, rendered.asPng());
}

export class FoundryService<A extends FoundryActor> {
    private readonly _config: FoundryConfig;
    private readonly _loadActors: () => Promise<A[]>;

    private actors: Map<string, A>;

    constructor(config: FoundryConfig, loadActors: () => Promise<A[]>) {
        this._config = config;
        this._loadActors = loadActors;

        // Perform initial load
        this.loadAllData().catch(e => {
            Logger.errorSync(e.toString());
            process.exit(1);
        });
    }

    async getImage(model: FoundryModel): Promise<string> {
        return await this.getImageUrl(model.img, 'icons/vtt.png');
    }

    async getThumbnail(model: FoundryModel): Promise<string> {
        return await this.getImageUrl(model.thumbnail || model.img, 'icons/vtt-512.png');
    }

    async getImageUrl(path: string | null | undefined, fallback?: string): Promise<string | undefined> {
        if (!path) {
            return fallback ? this._config.baseUrl + fallback : undefined;
        }
        if (path.endsWith('.svg')) {
            try {
                const resultPath = 'svg2png/' + path.slice(0, -4) + '.png';
                if (!fsutils.existsSync(this._config.basePath + resultPath)) {
                    Logger.warn(`Attempting to convert ${path} to ${resultPath}...`);
                    const startTime = process.uptime();
                    await convertSvg(this._config.basePath + path, this._config.basePath + resultPath);
                    Logger.warn(`Took ${process.uptime() - startTime} seconds to convert to PNG.`);
                }
                return this._config.baseUrl + resultPath;
            } catch (e) {
                await Logger.error(`Failed to convert ${path}: ${e}`);
                return fallback ? this._config.baseUrl + fallback : undefined;
            }
        }
        return this._config.baseUrl + path;
    }

    async loadAllData(forceRefresh?: boolean): Promise<void> {
        await this.getActors(forceRefresh);
    }

    async getActor(id: string): Promise<A | undefined> {
        return (await this.getActors()).get(id);
    }

    async getActors(forceRefresh?: boolean): Promise<Map<string, A>> {
        if (forceRefresh || !this.actors) {
            const actors = await this._loadActors();
            this.actors = createModelCollection(actors);
        }
        return this.actors;
    }

    private static async loadDatabase<M extends FoundryModel, T>(
        filename: string, guard: (m: FoundryModel) => m is M,
        constructor: new (m: M) => T, strict?: boolean): Promise<T[]> {
        const contents = await fs.readFile(filename, { encoding: 'utf-8' });
        const models: FoundryModel[] = contents
            .split('\n')
            .filter(data => data)
            .map(data => {
                try {
                    return JSON.parse(data);
                } catch (e) {
                    Logger.error('Failed to parse database: ' + data);
                }
            });
        const matches = models.filter(guard);
        if (strict && matches.length < models.length) {
            const badItem = models.find(item => !guard(item));
            throw new Error('Database entry of unexpected type: ' + badItem._id);
        }
        return matches.map(m => new constructor(m));
    }

    static loadCpr(config: FoundryConfig): FoundryService<CprActor> {
        const loadActors = async () => FoundryService.loadDatabase(config.actors, CprActor.isActor, CprActor);
        return new FoundryService<CprActor>(config, loadActors);
    }
}

export const foundryCpr = FoundryService.loadCpr(Config.foundry);
