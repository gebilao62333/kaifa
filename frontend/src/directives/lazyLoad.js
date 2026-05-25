const lazyLoadDirective = {
  mounted(el, binding) {
    const options = {
      rootMargin: binding.value?.rootMargin || '50px',
      threshold: binding.value?.threshold || 0
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
            observer.unobserve(img)
          }
        }
      })
    }, options)

    el._lazyLoadObserver = observer

    if (el.dataset.src) {
      observer.observe(el)
    }
  },
  updated(el) {
    if (el.dataset.src && el._lazyLoadObserver) {
      el._lazyLoadObserver.observe(el)
    }
  },
  unmounted(el) {
    if (el._lazyLoadObserver) {
      el._lazyLoadObserver.disconnect()
      delete el._lazyLoadObserver
    }
  }
}

export default lazyLoadDirective

export function createLazyLoadDirective(options = {}) {
  return {
    mounted(el, binding) {
      const observerOptions = {
        rootMargin: options.rootMargin || '50px',
        threshold: options.threshold || 0
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target
            const src = img.dataset.src
            if (src) {
              const lazySrc = binding.value?.load || src
              img.src = lazySrc
              img.removeAttribute('data-src')
              observer.unobserve(img)

              if (binding.value?.onLoaded) {
                binding.value.onLoaded(img)
              }
            }
          }
        })
      }, observerOptions)

      el._lazyLoadObserver = observer

      if (el.dataset.src) {
        observer.observe(el)
      }
    },
    unmounted(el) {
      if (el._lazyLoadObserver) {
        el._lazyLoadObserver.disconnect()
        delete el._lazyLoadObserver
      }
    }
  }
}
