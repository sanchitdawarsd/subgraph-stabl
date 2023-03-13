// noinspection JSUnusedGlobalSymbols

import {BribeEntity, GaugeAttachment, GaugeEntity, Pair, Token, VeEntity, VeNFTEntity, Vote,Fourpool, Fourpool} from '../types/schema'
import {BribeTemplate, GaugeTemplate} from '../types/templates';
import {ADDRESS_4POOL, ADDRESS_SATIN, ZERO_BD, ZERO_BI} from './constants';
import {
  Abstained,
  Attach,
  Deposit,
  Detach,
  GaugeCreated,
  Voted,
  VoterAbi,
  Whitelisted,
  Withdraw
} from '../types/templates/VoterTemplate/VoterAbi';
import {Address, BigDecimal, BigInt, log, store} from '@graphprotocol/graph-ts';
import {abs, calculateApr, fetchTokenName, fetchTokenSymbol, formatUnits} from './helpers';
import {VeAbi} from '../types/templates/VoterTemplate/VeAbi';
import {GaugeAbi} from '../types/templates/VoterTemplate/GaugeAbi';
import {MinterAbi} from '../types/templates/VoterTemplate/MinterAbi';


export function handleGaugeCreated(event: GaugeCreated): void {
  log.info('voter to be displaye', [])
  let gauge = getOrCreateGauge(event.params.gauge.toHexString())
  const voterCtr = VoterAbi.bind(event.address)
  log.info('voter to be displayed: {}', [event.address.toHexString()])

  let bribe = BribeEntity.load(event.params.external_bribe.toHexString())
  log.info('bribe to be displayed: {}', [event.params.external_bribe.toHexString()])
  
  // fetch info if null
  if (!bribe) {
    bribe = new BribeEntity(event.params.external_bribe.toHexString())
    bribe.pair = event.params.pool.toHexString()
    bribe.ve = voterCtr.ve().toHexString()
    bribe.veUnderlying = voterCtr.token().toHexString();
    bribe.bribeTokensAdr = [];
    BribeTemplate.create(event.params.external_bribe);
    bribe.save()
  }
if(event.params.pool.toHexString() == ADDRESS_4POOL){
  log.info('pool1 to be displayed: {}', [event.params.pool.toHexString()])
  let pool = new Fourpool(event.params.pool.toHexString()) as Fourpool
  log.info('pool1pair to be displayed: {}', [pool.id])
  
  pool.gauge = gauge.id
  pool.gaugebribes = bribe.id
  gauge.bribe = bribe.id
  // save updated values
  gauge.save()
  pool.save()
}else{
  log.info('pool2 to be displayed: {}', [event.params.pool.toHexString()])
  let pair = Pair.load(event.params.pool.toHexString()) as Pair;
  log.info('pool2pair to be displayed: {}', [pair.id])
  pair.gauge = gauge.id
  pair.gaugebribes = bribe.id
  gauge.bribe = bribe.id

  // save updated values
  gauge.save()
  pair.save()
}
  
}

export function handleWhitelisted(event: Whitelisted): void {
  let token = Token.load(event.params.token.toHexString())
  if (!token) {
    return;
  }
  token.isWhitelisted = true
  token.save()
}

export function handleDeposit(event: Deposit): void {
  const gaugeAttachment = getOrCreateGaugeAttachment(event.params.gauge.toHexString(), event.params.lp.toHexString());
  gaugeAttachment.deposit = gaugeAttachment.deposit.plus(formatUnits(event.params.amount, BigInt.fromI32(18)))
  gaugeAttachment.veNFT = event.params.tokenId.toString()
  gaugeAttachment.save();
}

export function handleWithdraw(event: Withdraw): void {
  const gaugeAttachment = getOrCreateGaugeAttachment(event.params.gauge.toHexString(), event.params.lp.toHexString());
  gaugeAttachment.deposit = gaugeAttachment.deposit.minus(formatUnits(event.params.amount, BigInt.fromI32(18)));
  // emit with veId means full withdraw and unlock ve
  if (event.params.tokenId.notEqual(ZERO_BI)) {
    gaugeAttachment.veNFT = null;
  }
  gaugeAttachment.save();
}

export function handleAttach(event: Attach): void {
  const ve = getVeNFT(event.params.tokenId.toString())
  ve.attachments = ve.attachments + 1;
  ve.save();
}

export function handleDetach(event: Detach): void {
  const ve = getVeNFT(event.params.tokenId.toString())
  ve.attachments = ve.attachments - 1;
  ve.save();
}

export function handleVoted(event: Voted): void {
  const veNft = getVeNFT(event.params.tokenId.toString());
  fetchAllVotedPools(veNft, event.address.toHex());
}

export function handleAbstained(event: Abstained): void {
  const veNft = getVeNFT(event.params.tokenId.toString());

  // assume that reset call generate events before vote event
  // hope subgraph will handle events ordered

  if (veNft.voteIds.length != 0) {
    const voterCtr = VoterAbi.bind(event.address)
    const ve = VeEntity.load(veNft.ve) as VeEntity;
    const minterCtr = MinterAbi.bind(Address.fromString(ve.underlyingMinter));

    const weekly = formatUnits(minterCtr.WEEKLY_EMISSION(), BigInt.fromI32(18));
    const totalWeight = formatUnits(voterCtr.totalWeight(), BigInt.fromI32(18));

    for (let i = 0; i < veNft.voteIds.length; i++) {

      const vote = Vote.load(veNft.voteIds[i]) as Vote;
      if (!vote) {
        continue;
      }

      updateGaugeVotes(
        vote.gauge,
        voterCtr,
        vote.pool,
        totalWeight,
        weekly,
        ve.underlying
      );

      store.remove('Vote', veNft.voteIds[i]);
    }

    veNft.voteIds = [];
    veNft.save();
  }
}

// *****************************************************
//                     HELPERS
// *****************************************************

function getOrCreateGauge(
  gaugeAdr: string
): GaugeEntity {
  let gauge = GaugeEntity.load(gaugeAdr)

  if (!gauge) {
    gauge = new GaugeEntity(gaugeAdr)
    const gaugeCtr = GaugeAbi.bind(Address.fromString(gaugeAdr));
    const bribe = gaugeCtr.try_external_bribe()
    if (bribe.reverted) {
      log.critical("BRIBE NOT FOUND, gauge: {}", [gaugeAdr]);
    }
    gauge.bribe = bribe.value.toHex()
    gauge.pair = gaugeCtr.underlying().toHex()
    gauge.totalSupply = ZERO_BD
    gauge.totalSupplyETH = ZERO_BD
    gauge.totalDerivedSupply = ZERO_BD
    gauge.voteWeight = ZERO_BD
    gauge.expectedAmount = ZERO_BD
    gauge.expectAPR = ZERO_BD
    gauge.expectAPRDerived = ZERO_BD
    gauge.totalWeight = ZERO_BD
    gauge.rewardTokensAddresses = []
    GaugeTemplate.create(Address.fromString(gaugeAdr))
  }
  return gauge;
}

function getVeNFT(veId: string): VeNFTEntity {
  const ve = VeNFTEntity.load(veId);
  if (!ve) {
    log.critical("VE NOT FOUND", [veId]);
  }
  return ve as VeNFTEntity;
}

function getOrCreateGaugeAttachment(gaugeAdr: string, userAdr: string): GaugeAttachment {
  let user = GaugeAttachment.load(gaugeAdr + userAdr);
  if (!user) {
    user = new GaugeAttachment(gaugeAdr + userAdr);
    user.gauge = gaugeAdr
    user.user = userAdr
    user.deposit = ZERO_BD
  }
  return user;
}

function getOrCreateVote(voterAdr: string, veId: string, gaugeAdr: string): Vote {
  let vote = Vote.load(generateVoteId(voterAdr, veId, gaugeAdr));
  if (!vote) {
    vote = new Vote(generateVoteId(voterAdr, veId, gaugeAdr));

    vote.voter = voterAdr;
    vote.veNFT = veId;
    vote.gauge = gaugeAdr
    vote.weight = ZERO_BD
    vote.weightPercent = ZERO_BD
  }
  return vote;
}

// shortcut for fetch voted gauges, event doesn't have info about it
function fetchAllVotedPools(veNFT: VeNFTEntity, voterAdr: string): void {
  if (veNFT.voteIds.length == 0) {
    const ve = VeEntity.load(veNFT.ve) as VeEntity;
    const voterCtr = VoterAbi.bind(Address.fromString(voterAdr));
    const veCtr = VeAbi.bind(Address.fromString(veNFT.ve))
    const vePower = formatUnits(veCtr.balanceOfNFT(BigInt.fromString(veNFT.id)), BigInt.fromI32(18))
    const minterCtr = MinterAbi.bind(Address.fromString(ve.underlyingMinter));

    const weekly = formatUnits(minterCtr.WEEKLY_EMISSION(), BigInt.fromI32(18));
    const totalWeight = formatUnits(voterCtr.totalWeight(), BigInt.fromI32(18));

    for (let i = 0; i < 1000; i++) {
      const pool = voterCtr.try_poolVote(BigInt.fromString(veNFT.id), BigInt.fromI32(i));
      if (pool.reverted) {
        break;
      }
      log.info('Message to be displayed: {}', [pool.value.toHexString()])
      if(pool.value.toHexString() == ADDRESS_4POOL){
        log.info("mess1",[])
        const fourpool = Fourpool.load(pool.value.toHex()) as Fourpool;
        const gaugeAdr = fourpool.gauge as string;
        if (!gaugeAdr) {
          log.info("NO GAUGE FOR VOTE {}", [pool.value.toHex()]);
          continue;
        }
        log.info('Message3 to be displayed: {}', [gaugeAdr])
        const vote = getOrCreateVote(voterAdr, veNFT.id, gaugeAdr);
  
        vote.pool = pool.value.toHex()
        vote.weight = formatUnits(voterCtr.votes(BigInt.fromString(veNFT.id), pool.value), BigInt.fromI32(18));
        log.info('Message4 to be displayed: {}', [vote.weight.toString()])
        vote.weightPercent = abs(vote.weight.div(vePower).times(BigDecimal.fromString('100')));
  
        updateGaugeVotes(
          gaugeAdr,
          voterCtr,
          pool.value.toHex(),
          totalWeight,
          weekly,
          ve.underlying
        );
  
        const arr = veNFT.voteIds;
        arr.push(vote.id);
        veNFT.voteIds = arr;
        veNFT.save();
  
        vote.save();
      }
      else{
        log.info("mess2",[])
        const pair = Pair.load(pool.value.toHex()) as Pair;
        const gaugeAdr = pair.gauge as string;
        if (!gaugeAdr) {
          log.info("NO GAUGE FOR VOTE {}", [pool.value.toHex()]);
          continue;
        }
        log.info('Message3 to be displayed: {}', [gaugeAdr])
        const vote = getOrCreateVote(voterAdr, veNFT.id, gaugeAdr);
  
        vote.pool = pool.value.toHex()
        vote.weight = formatUnits(voterCtr.votes(BigInt.fromString(veNFT.id), pool.value), BigInt.fromI32(18));
        log.info('Message4 to be displayed: {}', [vote.weight.toString()])
        vote.weightPercent = abs(vote.weight.div(vePower).times(BigDecimal.fromString('100')));
  
        updateGaugeVotes(
          gaugeAdr,
          voterCtr,
          pool.value.toHex(),
          totalWeight,
          weekly,
          ve.underlying
        );
  
        const arr = veNFT.voteIds;
        arr.push(vote.id);
        veNFT.voteIds = arr;
        veNFT.save();
  
        vote.save();
        
      }
    }
  }
}

function updateGaugeVotes(
  gaugeAdr: string,
  voterCtr: VoterAbi,
  poolAdr: string,
  totalWeight: BigDecimal,
  weekly: BigDecimal,
  veUnderlying: string
): void {
  const gauge = GaugeEntity.load(gaugeAdr) as GaugeEntity;
  gauge.voteWeight = formatUnits(voterCtr.weights(Address.fromString(poolAdr)), BigInt.fromI32(18));
  gauge.totalWeight = totalWeight;
  gauge.expectedAmount = gauge.voteWeight.div(totalWeight).times(weekly);
  const gaugeCtr = GaugeAbi.bind(Address.fromString(gaugeAdr));
  log.info("calc aprs {} {} {} {} {}",[gaugeAdr, veUnderlying, gauge.expectedAmount.toString() ,gaugeCtr.totalSupply().toHexString(),formatUnits(gaugeCtr.totalSupply(), BigInt.fromI32(18)).toString()])
  gauge.expectAPR = calculateExpectedApr(gaugeAdr, veUnderlying, gauge.expectedAmount, formatUnits(gaugeCtr.totalSupply(), BigInt.fromI32(18)));
  gauge.expectAPRDerived = calculateExpectedApr(gaugeAdr, veUnderlying, gauge.expectedAmount, gauge.totalDerivedSupply);
  gauge.save();
}


function calculateExpectedApr(
  gaugeAdr: string,
  rewardTokenAdr: string,
  expectedProfit: BigDecimal,
  gaugeTotalSupply: BigDecimal,
): BigDecimal {
  
  const gauge = getOrCreateGauge(gaugeAdr);
  if(gauge.pair == ADDRESS_4POOL){
    return ZERO_BD
  }else{  
    
    const pair = Pair.load(gauge.pair) as Pair;

  let pairPriceETH = ZERO_BD;
  if (pair.totalSupply.notEqual(ZERO_BD)) {
    pairPriceETH = pair.reserveETH.div(pair.totalSupply);
  } else {
    return ZERO_BD;
  }
  const totalSupplyETH = gaugeTotalSupply.times(pairPriceETH);

  return calculateApr(ZERO_BI, BigInt.fromI32(60 * 60 * 24 * 7), expectedProfit, totalSupplyETH);

  }
  
}

function generateVoteId(voterAdr: string, veId: string, gaugeAdr: string): string {
  return voterAdr + veId + gaugeAdr;
}
