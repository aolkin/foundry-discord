import {
    ApplicationCommandOptionChoiceData,
    AutocompleteFocusedOption,
    AutocompleteInteraction,
    ChatInputCommandInteraction, EmbedBuilder,
    PermissionsString,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import {
    FoundryActor,
    foundryCpr,
    FoundryModel,
    FoundryService,
} from '../../services/foundry-service.js';
import { Lang, Logger } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Args, Command, CommandDeferType } from '../index.js';

function* fuzzyFilter<T extends FoundryModel>(
    collection: Iterable<T>,
    match: string
): IterableIterator<T> {
    for (let value of collection) {
        if (value.name.toLowerCase().includes(match.toLowerCase())) {
            yield value;
        }
    }
}

function foundryToChoice(model: FoundryModel): ApplicationCommandOptionChoiceData {
    return {
        name: model.name,
        value: model._id
    }
}

async function getFilteredActors(actors: Map<string, FoundryActor>, match: string, allTypes?: boolean): Promise<ApplicationCommandOptionChoiceData[]> {
    const filteredActors = Array.from(fuzzyFilter(actors.values(), match));
    const result = allTypes ? filteredActors : filteredActors.filter(actor => actor.isPlayerCharacter);
    return result.map(foundryToChoice);
}

async function getFilteredSkills(character: FoundryActor, match: string): Promise<ApplicationCommandOptionChoiceData[]> {
    if (!character || !character.skills) {
        return [];
    }
    return Array.from(fuzzyFilter(character.skills.values(), match)).map(foundryToChoice);
}

export class SkillCheckCommand implements Command {
    public names = [Lang.getRef('chatCommands.skill', Language.Default)];
    public cooldown = new RateLimiter(1, 1000);
    public deferType = CommandDeferType.NONE;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const characterId = intr.options.getString(Args.CHARACTER_OPTION.name);
        const skillId = intr.options.getString(Args.SKILL_OPTION.name);
        const modifier = intr.options.getNumber(Args.MODIFIER_OPTION.name);

        const character = await foundryCpr.getActor(characterId);
        if (!character) {
            await InteractionUtils.send(intr,
                Lang.getEmbed('errorEmbeds.characterNotFound', data.lang, {
                    CHARACTER: characterId
                })
            );
            return;
        }

        const skill = character.skills?.get(skillId);
        if (!skill) {
            await InteractionUtils.send(
                intr,
                Lang.getEmbed('errorEmbeds.skillNotFound', data.lang, {
                    CHARACTER: character.name ?? characterId,
                    SKILL: skillId
                })
            );
            return;
        }

        const roll = skill.roll(modifier ? { modifier } : undefined);
        Logger.info(`Rolled ${skill.name} for ${character.name}: ${roll}`);
        await InteractionUtils.deferReply(intr);

        const dieImage = await this.getDieImage(roll.dice[0], true);
        const embeds = [new EmbedBuilder({
            title: `${skill.name} = ${roll.value}`,
            author: {
                name: character.name,
                // iconURL: await foundryCpr.getThumbnail(character)
            },
            thumbnail: {
                url: await foundryCpr.getImage(character)
            },
            image: dieImage ? { url: dieImage } : undefined,
            description: roll.toString()
        })];
        for (let i = 1; i < roll.dice.length; i++) {
            const dieImage = await this.getDieImage(Math.abs(roll.dice[i]));
            if (dieImage) {
                embeds.push(new EmbedBuilder({
                    image: {
                        url: dieImage
                    }
                }))
            }
        }
        await InteractionUtils.send(intr, { embeds });
    }

    async autocomplete(
        intr: AutocompleteInteraction,
        option: AutocompleteFocusedOption
    ): Promise<ApplicationCommandOptionChoiceData[]> {
        switch (option.name) {
            case Args.CHARACTER_OPTION.name:
                const actors = await foundryCpr.getActors();
                return await getFilteredActors(actors, option.value);
            case Args.SKILL_OPTION.name:
                const characterId = intr.options.getString(Args.CHARACTER_OPTION.name);
                const character = await foundryCpr.getActor(characterId);
                return await getFilteredSkills(character, option.value);
            default:
                return [];
        }
    }

    private async getDieImage(value, useSpecials?: boolean): Promise<string | undefined> {
        let dieName = value.toString();
        if (useSpecials) {
            if (value === 1) {
                dieName += '_fail';
            } else if (value === 10) {
                dieName += '_preem';
            }
        }
        return await foundryCpr.getImageUrl(`systems/cyberpunk-red-core/icons/dice/red/d10_${dieName}.svg`);
    }
}
