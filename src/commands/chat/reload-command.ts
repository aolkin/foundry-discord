import { ChatInputCommandInteraction, EmbedBuilder, PermissionsString } from 'discord.js';

import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { foundryCpr } from '../../services/foundry-service.js';
import { Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

export class ReloadCommand implements Command {
    public names = [Lang.getRef('chatCommands.reload', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        await InteractionUtils.deferReply(intr);
        await foundryCpr.loadAllData(true);
        const embed: EmbedBuilder = Lang.getEmbed('displayEmbeds.reloadComplete', data.lang);
        await InteractionUtils.send(intr, embed);
    }
}
