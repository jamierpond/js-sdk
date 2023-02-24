#!/usr/bin/env ts-node

import { LightsparkWalletClient } from "@lightspark/js-sdk";
import { AccountTokenAuthProvider } from "@lightspark/js-sdk/auth";
import {
  CurrencyUnit,
  InvoiceType,
} from "@lightspark/js-sdk/generated/graphql";
import { Command } from "commander";
import { getCredentialsFromEnvOrThrow } from "./authHelpers.js";

const main = async (program: Command) => {
  const account = getCredentialsFromEnvOrThrow();
  const client = new LightsparkWalletClient(
    new AccountTokenAuthProvider(account.clientId, account.clientSecret),
    account.walletNodeId
  );
  const options = program.opts();
  console.log("Options: ", JSON.stringify(options, null, 2));
  const invoice = await client.createInvoice(
    { value: options.amount, unit: CurrencyUnit.Satoshi },
    options.memo,
    options.amp ? InvoiceType.Amp : InvoiceType.Standard
  );
  console.log("Invoice:", JSON.stringify(invoice, null, 2));
};

(() => {
  const program = new Command();
  program
    .name("CreateInvoice")
    .version("1.0.0")
    .description("Create an invoice for your wallet node")
    .option("-m, --memo  <value>", "Add a memo describing the invoice.", null)
    .option("-a, --amount <number>", "The amount of the invoice.", parseInt, 0)
    .option("--amp", "Flag to use AMP invoices.", false)
    .parse(process.argv);

  const options = program.opts();
  if (!options.amount) {
    program.outputHelp();
  } else {
    // tslint:disable-next-line
    main(program)
      .catch((err) => console.error("Oh no, something went wrong.\n", err))
  }
})();