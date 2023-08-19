import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { Command, CommandDeferType } from '..';
import { Language } from '../../models/enum-helpers';
import { EventData } from '../../models/internal-models.js';
import { Lang } from '../../services';
import { InteractionUtils } from '../../utils';

export class TestCommand implements Command {
    public names = [Lang.getRef('chatCommands.test', Language.Default)];
    public cooldown = new RateLimiter(1, 5000);
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.test', data.lang));
    }
}
