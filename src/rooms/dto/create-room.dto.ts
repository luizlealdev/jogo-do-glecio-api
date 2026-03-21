import { IsBoolean, IsNotEmpty, IsNotEmptyObject, isNotEmptyObject, IsNumber } from "class-validator";

type OperationType = "all" | "sum" | "sub" | "mult" | "div";

class CreateRoomConfig {
    @IsBoolean()
    @IsNotEmpty()
    hostPlays: boolean;

    @IsNumber()
    time: number;

    operations: OperationType[]
}

export class CreateRoomDto {
    @IsNotEmptyObject()
    config: CreateRoomConfig
}

