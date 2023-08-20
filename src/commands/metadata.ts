import {
    ApplicationCommandType,
    PermissionFlagsBits,
    PermissionsBitField,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
    RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from 'discord.js';

import { Args } from './index.js';
import { Language } from '../models/enum-helpers/index.js';
import { Lang } from '../services/index.js';

export const ChatCommandMetadata: {
    [command: string]: RESTPostAPIChatInputApplicationCommandsJSONBody;
} = {
    DEV: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.dev', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.dev'),
        description: Lang.getRef('commandDescs.dev', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.dev'),
        dm_permission: true,
        default_member_permissions: PermissionsBitField.resolve([
            PermissionFlagsBits.Administrator,
        ]).toString(),
        options: [
            {
                ...Args.DEV_COMMAND,
                required: true,
            },
        ],
    },
    HELP: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.help', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.help'),
        description: Lang.getRef('commandDescs.help', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.help'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.HELP_OPTION,
                required: true,
            },
        ],
    },
    RELOAD: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.reload', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.reload'),
        description: Lang.getRef('commandDescs.reload', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.reload'),
        dm_permission: false,
        default_member_permissions: PermissionsBitField.resolve([
            PermissionFlagsBits.Administrator,
        ]).toString(),
    },
    SKILL: {
        type: ApplicationCommandType.ChatInput,
        name: Lang.getRef('chatCommands.skill', Language.Default),
        name_localizations: Lang.getRefLocalizationMap('chatCommands.skill'),
        description: Lang.getRef('commandDescs.skill', Language.Default),
        description_localizations: Lang.getRefLocalizationMap('commandDescs.skill'),
        dm_permission: true,
        default_member_permissions: undefined,
        options: [
            {
                ...Args.CHARACTER_OPTION,
                required: true,
            },
            {
                ...Args.SKILL_OPTION,
                required: true,
            },
            Args.MODIFIER_OPTION,
        ],
    },
};

export const MessageCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    // VIEW_DATE_SENT: {
    //     type: ApplicationCommandType.Message,
    //     name: Lang.getRef('messageCommands.viewDateSent', Language.Default),
    //     name_localizations: Lang.getRefLocalizationMap('messageCommands.viewDateSent'),
    //     default_member_permissions: undefined,
    //     dm_permission: true,
    // },
};

export const UserCommandMetadata: {
    [command: string]: RESTPostAPIContextMenuApplicationCommandsJSONBody;
} = {
    // VIEW_DATE_JOINED: {
    //     type: ApplicationCommandType.User,
    //     name: Lang.getRef('userCommands.viewDateJoined', Language.Default),
    //     name_localizations: Lang.getRefLocalizationMap('userCommands.viewDateJoined'),
    //     default_member_permissions: undefined,
    //     dm_permission: true,
    // },
};
