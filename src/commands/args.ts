import { APIApplicationCommandBasicOption, ApplicationCommandOptionType } from 'discord.js';

import { DevCommandName, HelpOption } from '../enums/index.js';
import { Language } from '../models/enum-helpers/index.js';
import { Lang } from '../services/index.js';

export class Args {
    public static readonly DEV_COMMAND: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.command', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.command'),
        description: Lang.getRef('argDescs.devCommand', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.devCommand'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('devCommandNames.info', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('devCommandNames.info'),
                value: DevCommandName.INFO,
            },
        ],
    };
    public static readonly HELP_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.option', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.option'),
        description: Lang.getRef('argDescs.helpOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.helpOption'),
        type: ApplicationCommandOptionType.String,
        choices: [
            {
                name: Lang.getRef('helpOptionDescs.contactSupport', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('helpOptionDescs.contactSupport'),
                value: HelpOption.CONTACT_SUPPORT,
            },
            {
                name: Lang.getRef('helpOptionDescs.commands', Language.Default),
                name_localizations: Lang.getRefLocalizationMap('helpOptionDescs.commands'),
                value: HelpOption.COMMANDS,
            },
        ],
    };
    public static readonly CHARACTER_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.character', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.character'),
        description: Lang.getRef('argDescs.characterOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.characterOption'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
    };
    public static readonly SKILL_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.skill', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.skill'),
        description: Lang.getRef('argDescs.skillOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.skillOption'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
    };
    public static readonly MODIFIER_OPTION: APIApplicationCommandBasicOption = {
        name: Lang.getRef('arguments.modifier', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('arguments.modifier'),
        description: Lang.getRef('argDescs.modifierOption', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('argDescs.modifierOption'),
        type: ApplicationCommandOptionType.Number,
    };
}
