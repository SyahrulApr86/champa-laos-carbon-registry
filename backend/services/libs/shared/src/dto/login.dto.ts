import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class LoginDto {
    @IsEmail()
    @IsNotEmpty()
    @ApiProperty()
    username: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty()
    password: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    captchaChallengeId: string;

    @IsOptional()
    @IsString()
    @ApiProperty()
    captchaText: string;
}