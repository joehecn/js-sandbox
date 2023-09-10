// npm run test src/__tests__/index.spec.ts

import { describe, it, expect } from 'vitest';
import JsSandbox from '../index';

describe('Decode', () => {
  it("Error: 'Encode' is not defined", async () => {
    try {
      const jsSandbox = new JsSandbox();
      await jsSandbox.init();
      await jsSandbox.runCodeSafe('', null);
    } catch (error) {
      expect((error as any).message).toEqual("main function is not defined");
    }
  });

  it('Error: interrupted', async () => {
    const fun = `
      function Decode(option) {
        while(true) {}
      }
    `;

    try {
      const jsSandbox = new JsSandbox({
        mainFunction: 'Decode'
      });
      await jsSandbox.init();
      await jsSandbox.runCodeSafe(fun, {});
    } catch (error) {
      expect((error as any).message).toEqual('interrupted');
    }
  });

  it('Error: The number out of range 1', async () => {
    const fun = `
      function Decode(option) {
        T_M_FLOAT_AB_CD([17142, 65536], 0)
      }
    `;

    try {
      const jsSandbox = new JsSandbox({
        mainFunction: 'Decode'
      });
      await jsSandbox.init();
      await jsSandbox.runCodeSafe(fun, {});
    } catch (error) {
      expect((error as any).message).toEqual('The number out of range');
    }
  });

  it('Basc should be ok', async () => {
    const fun = `
      function Decode(option) {
        const { laundry } = option
        console.log(atob)
        console.log(btoa)
        return {
          data: {
            woosing_laundry_sta: laundry,
          },
          status: {
            woosing_laundry_sta: laundry,
          }
        }
      }
    `;

    const option = {
      laundry: true,
    };

    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);

    expect(res).toEqual({
      data: {
        woosing_laundry_sta: true,
      },
      status: {
        woosing_laundry_sta: true,
      },
    });
  });

  it('xml should be ok', async () => {
    const fun = `
      function Decode(option) {
        const {
          body: {
            payload
          }
          // header: {
          //   channelNo,
          //   deviceId,
          //   messageId,
          //   messageTime,
          //   type
          // }
        } = option

        /**
         * default options: {
         *  object: true, // true 解析为对象, false 解析为 JSON 字符串
         *  coerce: false // 如果为 true 会强转对象, 比如字符串转数值
         * }
         */
        const {
          EventNotificationAlert: {
            peopleCounting: {
              enter,
              exit
            },
            childCounting: {
              enter: child_enter,
              exit: child_exit
            }
          }
        } = T_U_XML_TO_JSON(payload)

        const obj = {
          enter: Number(enter),
          exit: Number(exit),
          child_enter: Number(child_enter),
          child_exit: Number(child_exit)
        }

        return {
          data: obj,
          status: obj
        }

        // return {
        //   data: {},
        //   channelNo,
        //   deviceId,
        //   messageId,
        //   messageTime,
        //   type,
        //   EventNotificationAlert
        // }
      }
    `;

    const option = {
      body: {
        payload:
          '<?xml version="1.0" encoding="UTF-8"?>\r\n<EventNotificationAlert version="1.0" xmlns="urn:psialliance-org">\r\n<ipAddress>192.168.10.32</ipAddress>\r\n<protocolType>HTTP</protocolType>\r\n<macAddress>24:28:fd:f3:3a:11</macAddress>\r\n<channelID>1</channelID>\r\n<dateTime>2021-10-12T19:15:00+08:00</dateTime>\r\n<activePostCount>1</activePostCount>\r\n<eventType>PeopleCounting</eventType>\r\n<eventState>active</eventState>\r\n<eventDescription>peopleCounting alarm</eventDescription>\r\n<channelName>Camera 01</channelName>\r\n<peopleCounting>\r\n<statisticalMethods>timeRange</statisticalMethods>\r\n<TimeRange>\r\n<startTime>2021-10-12T19:00:00+08:00</startTime>\r\n<endTime>2021-10-12T19:15:00+08:00</endTime>\r\n</TimeRange>\r\n<enter>0</enter>\r\n<exit>1</exit>\r\n<regionsID>1</regionsID>\r\n</peopleCounting>\r\n<childCounting>\r\n<enter>0</enter>\r\n<exit>0</exit>\r\n</childCounting>\r\n</EventNotificationAlert>\r\n',
      },
      header: {
        channelNo: 0,
        deviceId: 'G38086739',
        messageId: '61656e356fd6d0001e06ea1c',
        messageTime: 1634037301071,
        type: 'ys.open.isapi',
      },
    };

    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);

    expect(res).toEqual({
      data: {
        enter: 0,
        exit: 1,
        child_enter: 0,
        child_exit: 0,
      },
      status: {
        enter: 0,
        exit: 1,
        child_enter: 0,
        child_exit: 0,
      },
    });
  });

  it('xml document', async () => {
    const fun = `
      function Decode(option) {
        const { payload } = option

        T_U_XML_TO_JSON(payload, { object: false })

        return option
      }
    `;
    const option = {
      payload:
        '<?xml version="1.0" encoding="UTF-8"?>\r\n<EventNotificationAlert version="1.0" xmlns="urn:psialliance-org">\r\n<ipAddress>192.168.10.32</ipAddress>\r\n<protocolType>HTTP</protocolType>\r\n<macAddress>24:28:fd:f3:3a:11</macAddress>\r\n<channelID>1</channelID>\r\n<dateTime>2021-10-12T19:15:00+08:00</dateTime>\r\n<activePostCount>1</activePostCount>\r\n<eventType>PeopleCounting</eventType>\r\n<eventState>active</eventState>\r\n<eventDescription>peopleCounting alarm</eventDescription>\r\n<channelName>Camera 01</channelName>\r\n<peopleCounting>\r\n<statisticalMethods>timeRange</statisticalMethods>\r\n<TimeRange>\r\n<startTime>2021-10-12T19:00:00+08:00</startTime>\r\n<endTime>2021-10-12T19:15:00+08:00</endTime>\r\n</TimeRange>\r\n<enter>0</enter>\r\n<exit>1</exit>\r\n<regionsID>1</regionsID>\r\n</peopleCounting>\r\n<childCounting>\r\n<enter>0</enter>\r\n<exit>0</exit>\r\n</childCounting>\r\n</EventNotificationAlert>\r\n',
    };
    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);
    expect(res).toEqual(option);
  });

  it('Temperature Decode', async () => {
    const fun = `
      function Decode(option) {
        const [data_0,data_1, data_2, data_3, data_4, data_5, data_6, data_7, data_8] = base64ToArr(option.data);

        const objstatus = {}
        const objdata = {}
        
        if (data_0 === 202 && data_1 === 2) {

          objdata['lora_set_temp'] = data_8;
          objdata['lora_temp_current'] = data_7;

          objstatus['lora_set_temp'] = data_8;
          objstatus['lora_temp_current'] = data_7;
          objstatus['lora_switch'] = !!data_4;
          objstatus['lora_mode'] = modeMapping[data_5];
          objstatus['lora_fan_speed'] = fanSpeedMapping[data_6];
          
        }else if(data_0 === 251 && data_1 === 4){
            switch(data_2){
              case 3: // 开关
                objstatus['lora_switch'] = !!data_3;
              break
              case 5: //模式：01 制冷、02 加热、04 除湿、08 通风
                objstatus['lora_mode'] = modeMapping[data_3];
              break
              case 6: //风速：(01 高速、02 中速、04 低速、08 自动
                objstatus['lora_fan_speed'] = fanSpeedMapping[data_4];

                objstatus['lora_mode'] = modeMapping[data_3];
              break
              case 7: //温度设定
                objstatus['lora_set_temp'] = data_4;
                objdata['lora_set_temp'] = data_4;

                objstatus['lora_mode'] = modeMapping[data_3];
              break
            }
        }
        return { status: objstatus,data: objdata }
      }

      const modeMapping = {
        1: "cool",
        2: "heat",
        4: "dry",
        8: "fan"
      }

      const fanSpeedMapping = {
        1: "high",
        2: "middle",
        4: "low",
        8: "auto"
      }
      function base64ToArr(str) {
        const raw = atob(str)

        const arr = []
        for (let i = 0, len = raw.length; i < len; i++) {
          arr.push(raw.charCodeAt(i))
        }

        return arr
      }
    `;
    const option = {
      applicationID: '16',
      applicationName: 'test_yin',
      deviceName: 'test_yin',
      devEUI: 'ca10010aca10010a',
      rxInfo: [
        {
          gatewayID: 'a840411eeda44150',
          uplinkID: 'cc8628df-7c95-4251-84eb-e294a8ffdd10',
          name: 'fusquare-dragino-gw',
          time: '2023-04-20T03:26:45.893864Z',
          rssi: -72,
          loRaSNR: 9.8,
          location: {
            latitude: 0,
            longitude: 0,
            altitude: 0,
          },
        },
      ],
      txInfo: {
        frequency: 923400000,
        dr: 2,
      },
      adr: false,
      fCnt: 3,
      fPort: 5,
      data: 'ygIAAAEBBBgTFUE=',
    };

    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);
    console.log(res);

    expect(res).toEqual({
      status: {
        lora_set_temp: 19,
        lora_temp_current: 24,
        lora_switch: true,
        lora_mode: 'cool',
        lora_fan_speed: 'low',
      },
      data: {
        lora_set_temp: 19,
        lora_temp_current: 24,
      },
    });
  });

  it('Temperature Encode', async () => {
    const fun = `
      /*
      * 编码器 - 1.0.0
      *
      * 注意: 以<T_>开头的预设函数
      * */
      function arrToBase64(arr) {
        const b = String.fromCharCode(...arr)
        return btoa(b)
      }

      //1制冷<cold|cool>
      //2加热<hot,heat>
      //4 除湿<dry>
      //8通风<wind,fan>
      const lora_mode_set = {
        cold: 1,
        cool: 1,
        hot: 2,
        heat: 2,
        dry: 4,
        wind: 8,
        fan: 8
      }

      /**
       * 1高速,2中速,4低速,8自动
       */
      const lora_fan_speed_set = {
        high: 1,
        middle: 2,
        low: 4,
        auto: 8
      }

      function Encode(option) {
        const cmd_array = [0xfa, 4, 0, 0];
        let [...new_cmd_array] = cmd_array
        const payload = []

        const cmd = option.cmd;

        //const status = option.status;
        const status = T_A_GET_STATUS();
        let lora_mode = ""
        if (cmd.lora_mode) {
          lora_mode = cmd.lora_mode
        } else {
          lora_mode = status.lora_mode
        }
        let mode = lora_mode_set[lora_mode];
        // if(mode != '01' || mode != '02' )
        // mode = '01';

        if (cmd && cmd.hasOwnProperty('lora_switch')) {
          [...new_cmd_array] = cmd_array;
          new_cmd_array[2] = 3;
          new_cmd_array[3] = cmd.lora_switch == true || cmd.lora_switch == 'true' ? 2 : 0;
          payload.push({
            fPort: 1,
            commands: {
              data: arrToBase64(new_cmd_array),
            }
          })
        }

        if (cmd && cmd.hasOwnProperty('lora_mode')) {
          [...new_cmd_array] = cmd_array;
          new_cmd_array[2] = 5;
          new_cmd_array[3] = lora_mode_set[cmd.lora_mode];
          payload.push({
            fPort: 2,
            commands: {
              data: arrToBase64(new_cmd_array)
            }
          })
        }
        if (cmd && cmd.hasOwnProperty('lora_fan_speed')) {
          [...new_cmd_array] = cmd_array;
          new_cmd_array[2] = 6;
          new_cmd_array[3] = mode;
          new_cmd_array.push(lora_fan_speed_set[cmd.lora_fan_speed])
          payload.push({
            fPort: 3,
            commands: {
              data: arrToBase64(new_cmd_array)
            }
          })
        }
        if (cmd && cmd.hasOwnProperty('lora_set_temp')) {
          [...new_cmd_array] = cmd_array;
          new_cmd_array[2] = 7;
          new_cmd_array[3] = mode;
          new_cmd_array.push(cmd.lora_set_temp)
          payload.push({
            fPort: 4,
            commands: {
              data: arrToBase64(new_cmd_array)
            }
          })
        }
        if (cmd && cmd.hasOwnProperty('lora_temp_current')) {
          [...new_cmd_array] = cmd_array;
          new_cmd_array[2] = 8;
          new_cmd_array[3] = Math.floor(cmd.lora_temp_current);
          new_cmd_array.push((cmd.lora_temp_current - Math.floor(cmd.lora_temp_current)) * 10)
          payload.push({
            fPort: 5,
            commands: {
              data: arrToBase64(new_cmd_array)
            }
          })
        }
        return {
          payload: payload
        }
      }
    `;
    const option = {
      cmd: {
        lora_switch: true,
        lora_mode: 'cold',
        lora_fan_speed: 'high',
      },
      status: {
        lora_switch: true,
        lora_mode: 'cool',
        lora_fan_speed: 'low',
        lora_temp_current: 24,
        lora_set_temp: 19,
      },
    };
    const jsSandbox = new JsSandbox({
      mainFunction: 'Encode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);
    expect(res).toEqual({
      payload: [
        {
          fPort: 1,
          commands: {
            data: '+gQDAg==',
          },
        },
        {
          fPort: 2,
          commands: {
            data: '+gQFAQ==',
          },
        },
        {
          fPort: 3,
          commands: {
            data: '+gQGAQE=',
          },
        },
      ],
    });
  });

  it('CVM-NRG96 Decode', async () => {
    const fun = `
      /*
      * 解码器 - 1.0.0
      *
      * 注意: 以<T_>开头的预设函数
      * */

      function Decode(option) {
        const { data, address, quantity } = option

        if (!(data && data.length === quantity)) return { data: {} }

        switch (address) {
          case 38:

            const obj = {
              kWh: T_M_LONG_AB_CD(data, 22),
              powerFactor: T_M_LONG_AB_CD(data, 0),
              THD_V_L1: T_M_LONG_AB_CD(data, 10),
              THD_V_L2: T_M_LONG_AB_CD(data, 12),
              THD_V_L3: T_M_LONG_AB_CD(data, 14),
              THD_A_L1: T_M_LONG_AB_CD(data, 16),
              THD_A_L2: T_M_LONG_AB_CD(data, 18),
              THD_A_L3: T_M_LONG_AB_CD(data, 20),
            }

            return {
              data: obj,
              status: obj
            }
          default:
            return { data: {} }
        }
      }
    `;
    const option = {
      data: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      address: 38,
      quantity: 24,
    };
    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);
    expect(res).toEqual({
      data: {
        kWh: 65537,
        powerFactor: 65537,
        THD_V_L1: 65537,
        THD_V_L2: 65537,
        THD_V_L3: 65537,
        THD_A_L1: 65537,
        THD_A_L2: 65537,
        THD_A_L3: 65537,
      },
      status: {
        kWh: 65537,
        powerFactor: 65537,
        THD_V_L1: 65537,
        THD_V_L2: 65537,
        THD_V_L3: 65537,
        THD_A_L1: 65537,
        THD_A_L2: 65537,
        THD_A_L3: 65537,
      },
    });
  });

  it('T_M_FLOAT_AB_CD skip < 0', async () => {
    const fun = `
      function Decode(option) {
        const { arr } = option
        T_M_FLOAT_AB_CD(arr, -1)
      }
    `;
    const option = {
      arr: [57920, 1],
    };

    try {
      const jsSandbox = new JsSandbox({
        mainFunction: 'Decode'
      });
      await jsSandbox.init();
      await jsSandbox.runCodeSafe(fun, option);
    } catch (error) {
      expect((error as any).message).toEqual('The skip out of range');
    }
  });
  it('T_M_FLOAT_AB_CD 123', async () => {
    const fun = `
      function Decode(option) {
        const { arr } = option

        return {
          data: T_M_FLOAT_AB_CD(arr, 0)
        }
      }
    `;
    const option = {
      arr: [17142, 0],
    };

    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);

    expect(res).toEqual({
      data: 123
    });
  })


  it('T_M_FLOAT_CD_AB skip < 0', async () => {
    const fun = `
      function Decode(option) {
        const { arr } = option
        T_M_FLOAT_CD_AB(arr, -1)
      }
    `;
    const option = {
      arr: [57920, 1],
    };

    try {
      const jsSandbox = new JsSandbox({
        mainFunction: 'Decode'
      });
      await jsSandbox.init();
      await jsSandbox.runCodeSafe(fun, option);
    } catch (error) {
      expect((error as any).message).toEqual('The skip out of range');
    }
  });
  it('T_M_LONG_AB_CD skip < 0', async () => {
    const fun = `
      function Decode(option) {
        const { arr } = option
        T_M_LONG_AB_CD(arr, -1)
      }
    `;
    const option = {
      arr: [57920, 1],
    };

    try {
      const jsSandbox = new JsSandbox({
        mainFunction: 'Decode'
      });
      await jsSandbox.init();
      await jsSandbox.runCodeSafe(fun, option);
    } catch (error) {
      expect((error as any).message).toEqual('The skip out of range');
    }
  });
  it('T_M_LONG_CD_AB skip < 0', async () => {
    const fun = `
      function Decode(option) {
        const { arr } = option
        T_M_LONG_CD_AB(arr, -1)
      }
    `;
    const option = {
      arr: [57920, 1],
    };

    try {
      const jsSandbox = new JsSandbox({
        mainFunction: 'Decode'
      });
      await jsSandbox.init();
      await jsSandbox.runCodeSafe(fun, option);
    } catch (error) {
      expect((error as any).message).toEqual('The skip out of range');
    }
  });
  it('T_M_SIGNED skip < 0', async () => {
    const fun = `
      function Decode(option) {
        const { arr } = option
        T_M_SIGNED(arr, -1)
      }
    `;
    const option = {
      arr: [57920],
    };

    try {
      const jsSandbox = new JsSandbox({
        mainFunction: 'Decode'
      });
      await jsSandbox.init();
      await jsSandbox.runCodeSafe(fun, option);
    } catch (error) {
      expect((error as any).message).toEqual('The skip out of range');
    }
  });

  it('T_M_LONG_CD_AB', async () => {
    const fun = `
      function Decode(option) {
        const { arr } = option

        return {
          data: T_M_LONG_CD_AB(arr, 0),
        }
      }
    `;
    const option = {
      arr: [57920, 1],
    };
    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);
    expect(res).toEqual({
      data: 123456,
    });
  });

  it('T_M_FLOAT_AB_CD_R', async () => {
    const fun = `
      function Decode(option) {
        const { num } = option

        return {
          data: T_M_FLOAT_AB_CD_R(num),
        }
      }
    `;
    const option = {
      num: 123,
    };
    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);
    expect(res).toEqual({
      data: [17142, 0],
    });
  });

  it('T_M_FLOAT_CD_AB_R', async () => {
    const fun = `
      function Decode(option) {
        const { num } = option

        return {
          data: T_M_FLOAT_CD_AB_R(num),
        }
      }
    `;
    const option = {
      num: 123,
    };
    const jsSandbox = new JsSandbox({
      mainFunction: 'Decode'
    });
    await jsSandbox.init();
    const res = await jsSandbox.runCodeSafe(fun, option);
    expect(res).toEqual({
      data: [0, 17142],
    });
  });
});
