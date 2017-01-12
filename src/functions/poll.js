import rq from 'request-promise-native'
import sleep from './sleep'

export default function poll (bot) {
  return bot.api('messages.getLongPollServer')
    .then(res => {
      request(`https://${res.server}?act=a_check&key=${res.key}` +
        `&wait=25&mode=2&version=1&ts=${res.ts}`)
    })
    .catch(err => console.log(err))

  function request (url) {
    return rq(url, { json: true })
      .catch(() => poll(bot))
      .then(res => {
        if (!res || !res.ts || res.failed) return poll(bot) // перезапуск при ошибке
        url = url.replace(/ts=.*/, `ts=${res.ts}`) // ставим новое время

        if (res.updates.length > 0) {
          for (let i = 0; i < res.updates.length; i++) {
            let update = res.updates[i]
            if (update[0] === 4) bot.emit('update', update)
          }
        }

        if (bot._stop) return null
        return sleep(300).then(() => request(url))
      })
  }
}
