import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Logger, TelegramClient } from "telegram";
import { StoreSession } from "telegram/sessions";
import { LogLevel } from "telegram/extensions/Logger";
import input from "input";

import * as path from "path";

const envFilePath = path.resolve(".env");
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath
    })],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: "Telegram",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const api_id = Number(configService.get<string>("TELEGRAM_API_ID"));
        const api_hash = configService.get<string>("TELEGRAM_API_HASH");
        const client = new TelegramClient(
            new StoreSession(".session", "_"),
            api_id,
            api_hash,
            {
              connectionRetries: 5,
              autoReconnect: true,
              baseLogger: new Logger(LogLevel.ERROR)
            }
        );

        await client.start({
          phoneNumber: async () => await input.text('Введите номер телефона: '),
          password: async () => await input.text('Введите пароль: '),
          phoneCode: async () =>
            await input.text('Введите код подтверждения: '),
          onError: (err) => console.log(err),
        });

        console.log(
            `${client.session.serverAddress}:${client.session.port} DC:${client.session.dcId}`,
        );

        client.session.save();

        return client;
      }
    },],
})
export class AppModule {}
