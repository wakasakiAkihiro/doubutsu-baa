/** Fisher–Yates bag: all items per cycle, with no repeat across boundaries. */
export class ShuffleBag<T> {
  private bag: T[] = []
  private last: T | undefined
  private readonly items: readonly T[]
  private readonly random: () => number
  constructor(items: readonly T[], random: () => number = Math.random) {
    if (items.length < 2 || new Set(items).size !== items.length)
      throw new Error('At least two unique items required.')
    this.items = [...items]
    this.random = random
  }
  private refill() {
    this.bag = [...this.items]
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      ;[this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]]
    }
    const end = this.bag.length - 1
    if (this.bag[end] === this.last) {
      const j = Math.floor(this.random() * end)
      ;[this.bag[end], this.bag[j]] = [this.bag[j], this.bag[end]]
    }
  }
  peek(): T {
    if (!this.bag.length) this.refill()
    return this.bag[this.bag.length - 1]
  }
  next(): T {
    this.last = this.peek()
    this.bag.pop()
    return this.last
  }
}
