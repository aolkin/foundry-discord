import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Command, CommandDeferType } from '..';
import { InfoOption } from '../../enums';
import { Language } from '../../models/enum-helpers';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services';
import { InteractionUtils } from '../../utils';

export class InfoCommand implements Command {
    public names = [Lang.getRef('chatCommands.info', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        const args = {
            option: intr.options.getString(
                Lang.getRef('arguments.option', Language.Default)
            ) as InfoOption,
        };

        let embed: EmbedBuilder;
        switch (args.option) {
            case InfoOption.ABOUT: {
                embed = Lang.getEmbed('displayEmbeds.about', data.lang);
                break;
            }
            case InfoOption.TRANSLATE: {
                embed = Lang.getEmbed('displayEmbeds.translate', data.lang);
                for (const langCode of Language.Enabled) {
                    embed.addFields([
                        {
                            name: Language.Data[langCode].nativeName,
                            value: Lang.getRef('meta.translators', langCode),
                        },
                    ]);
                }
                break;
            }
            default: {
                return;
            }
        }

        await InteractionUtils.send(intr, embed);
    }
}
