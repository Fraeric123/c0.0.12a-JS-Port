export class JavaRandom {
    static p2_16 = 0x10000;
    static p2_24 = 0x1000000;
    static p2_27 = 0x8000000;
    static p2_31 = 0x80000000;
    static p2_32 = 0x100000000;
    static p2_48 = 0x1000000000000;
    static p2_53 = Math.pow(2, 53);
    static m2_16 = 0xffff;
    static c2 = 0x0005;
    static c1 = 0xdeec;
    static c0 = 0xe66d;

    constructor(seedval) {
        this.s2 = 0; this.s1 = 0; this.s0 = 0;
        this.nextNextGaussian = 0;
        this.haveNextNextGaussian = false;

        if (seedval === undefined) {
            seedval = Math.floor(Math.random() * JavaRandom.p2_48);
        }
        this.seed = seedval;
        this.setSeed(seedval);
    }

    _next() {
        let carry = 0xb;
        let r0 = (this.s0 * JavaRandom.c0) + carry;
        carry = r0 >>> 16;
        r0 &= JavaRandom.m2_16;
        let r1 = (this.s1 * JavaRandom.c0 + this.s0 * JavaRandom.c1) + carry;
        carry = r1 >>> 16;
        r1 &= JavaRandom.m2_16;
        let r2 = (this.s2 * JavaRandom.c0 + this.s1 * JavaRandom.c1 + this.s0 * JavaRandom.c2) + carry;
        r2 &= JavaRandom.m2_16;

        this.s2 = r2; this.s1 = r1; this.s0 = r0;
        return (r2 << 16) | r1;
    }

    next(bits) { return this._next() >>> (32 - bits); }
    next_signed(bits) { return this._next() >> (32 - bits); }

    setSeed(n) {
        let bSeed = (BigInt(n) ^ 0x5DEECE66Dn) & ((1n << 48n) - 1n);

        this.s0 = Number(bSeed & 0xFFFFn);
        this.s1 = Number((bSeed >> 16n) & 0xFFFFn);
        this.s2 = Number((bSeed >> 32n) & 0xFFFFn);

        this.haveNextNextGaussian = false;
    }

    nextInt(bound) {
        if (bound === undefined) return this.next_signed(32);
        if (bound <= 0) throw new RangeError("bound must be positive");

        if ((bound & -bound) === bound) {
            return Number((BigInt(bound) * BigInt(this.next(31))) >> 31n);
        }

        let bits, val;
        do {
            bits = this.next(31);
            val = bits % bound;
        } while (bits - val + (bound - 1) < 0);
        return val;
    }

    nextBoolean() { return this.next(1) !== 0; }
    nextFloat() { return this.next(24) / JavaRandom.p2_24; }
    nextDouble() { return (JavaRandom.p2_27 * this.next(26) + this.next(27)) / JavaRandom.p2_53; }
}