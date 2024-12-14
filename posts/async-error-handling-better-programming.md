---
title: "Async Error Handling & Better Programming"
summary: 'Với việc đang viết chủ yếu trên các stack của JavaScript, bài viết nho nhỏ này là một "nỗ lực" để chia sẻ rõ ràng hơn về cách xử lí cách lỗi cũng như bắt lỗi một cách tốt hơn trong quá trình phát triển phần mềm.'
date: '2023-10-10'
tags:
  - sharing
  - development
  - javascript
images:
  - "https://grcviewpoint.com/wp-content/uploads/2022/11/Time-to-Correct-A-Long-standing-Curriculum-Coding-Error-Say-Experts-GRCviewpoint.jpg"
---

Như một lẽ tất yếu của phát triển phần mềm, quản lý lỗi, xử lí lỗi góp một phần rất quan trọng trong việc xây dựng nên sản phẩm chất lượng. Tương tự như việc đi ăn ở hàng quán trúng phải bát bún bò thiếu gia vị, một khi người dùng tìm tới sản phẩm tức là họ đang tìm một giải pháp cho vấn đề hiện trạng họ đang gặp phải. Việc có một vấn đề ngoài luồng nảy sinh ngay trong quá trình đang giải quyết nhu cầu chính rõ ràng là một vấn đề ảnh hưởng tới trải nghiệm của người dùng, hay nói nôm na hơn là ảnh hưởng tới cảm xúc của họ.

Với việc đang viết chủ yếu trên các stack của JavaScript, bài viết nho nhỏ này là một "nỗ lực" để chia sẻ rõ ràng hơn về cách xử lí cách lỗi cũng như bắt lỗi một cách tốt hơn trong quá trình phát triển phần mềm.

Giả sử chúng ta có một đoạn code như bên dưới:

```typescript
function execute(args: SomeThing) {
	return new Promise((resolve, reject) => {
		callSomeAsyncStuffs(args).then(response => {
			const result = doSomeOtherThing(response);
			return result;
		}).catch(e => {
			reject(e);
		})
	})
}
```

Actually, đây là một structure code đã tồn tại khá lâu và trước đây được tôi sử dụng khá thường xuyên. Is there any problem? Generally no, technically yes.

Trước tiên, việc viết như thế này chứng tỏ người viết chưa hiểu thật rõ về xử lí bất đồng bộ cũng như chưa nhận ra rõ bản chất của Promise. Hãy nói sơ qua về điều này trước tiên.

### Giải thích tóm gọn về Bất Đồng Bộ

Bất đồng bộ (asynchronous - async), là một thuật ngữ để chỉ việc trong 1 vị trí thời gian thực tế, có thể có nhiều hành động song song cùng thực hiện. Hãy lấy ví dụ việc thực thi các Promises cũng tương tự như một cuộc đua nơi có nhiều người cùng tham gia, mỗi người tham gia biểu thị cho một hành động được thực hiện và chúng sẽ hoàn thành khi chạm tới đích. Như vậy, ta có thể hiểu rằng các hành động có thể kết thúc sớm hoặc muộn, nhanh hoặc chậm tuỳ thuộc vào tính chất của từng hành động đó (tỉ dụ như anh A béo thì chạy chậm, anh B gầy thì sức bền không tốt, ...), còn phải tính cả việc có các biến cố ngẫu nhiên xảy ra trong quá trình thực hiện (anh C chạy nhanh nhưng tự dưng đau bụng, ...).

Với một người mới nhập môn JS, bất đồng bộ chưa bao giờ là một đề tài hết vấn đề để tìm hiểu, chưa kể nó cũng có rất nhiều biến thể, cách xử lí cũng như vấn đề để giải quyết (mà lớn nhất là Context, sẽ được nói sau).

Với Promise, có một số static method sau khá hữu dụng mà anh em có thể tìm hiểu thêm như một sự bổ sung:

- Promise.all: Hoàn tất khi tất cả promises truyền vào đã fulfill hết.
- Promise.race: Hoàn tất khi có một cái promise hoàn thành đầu tiên.
- Promise.allSettled: Hoàn tất khi tất cả promises truyền vào hoàn tất mà không quan tâm fulfilled hay rejected.

... nhiều nữa, anh em tự tìm hiểu.

Hãy nhớ rằng, async tạo ra một context riêng và nó không cùng context với sync. Để một ví dụ bên dưới để anh em có thể hiểu rõ hơn.

### Aysnc Context vs Sync Context

Hãy đọc đoạn code sau và đoán tình huống nào sẽ xảy ra:

```typescript
async function errorFunc() {
	// This function represent an error event that happen in async context
	throw new Error("This stupid code does not work properly");
}

function main() {
	// We will use try - catch here to handle error manually.
	try {
		errorFunc();
		console.log('Seems like no problem with this application.');
	} catch (e) {
		console.log(e);
	}
}

main();
```

Đoán xem, kết quả sẽ như thế nào. Cùng xem thử nhé:

![previewImage](https://i.imgur.com/WsFkxMb.png "Result")

Ah shit, không thấy catch lỗi gì cả. Vậy thì vấn đề nằm ở đâu? Đây chính là một ví dụ điển hình về Async Context mà rất rất là nhiều người gặp phải khi sử dụng try - catch để xử lí lỗi.

Tư duy của người bình thường sẽ như thế này, với try - catch block, các lỗi xảy ra trong try block sẽ ngay lập tức ngừng xử lí từ thời điểm execution có throw lỗi và chuyển ngay tới catch block - nơi thrown event / object sẽ được xử lí. Ngay ở đây chính là vấn đề, hãy đọc kỹ nếu bạn vẫn chưa hiểu rõ điều tôi nói.

Giải thích lại, trong try block, code sẽ được thực thi, khi có một lỗi nào đó xảy ra thì code sẽ ngừng ngay lại và chuyển sang block catch để xử lí tiếp. Với một sync context (một function không có async keyword như `function main`), thì việc execute của function `errorFunc` chỉ đơn giản là gọi tới nó (không lỗi syntax gì là được), mà không quan tâm nó thực thi như thế nào vì kết quả trả về của errorFunc là bất đồng bộ (không trả về tức thời).

Vậy giải pháp ở đây là biến sync context thành async context và thêm await khi execute. Nhìn đoạn code bên dưới:

```typescript
async function errorFunc() {
	// This function represent an error event that happen in async context
	throw new Error("This stupid code does not work properly");
}

async function main() {
	// We will use try - catch here to handle error manually.
	try {
		await errorFunc();
	} catch (e) {
		console.log(e);
	}
}

main().then(() => {
		console.log('Seems like no problem with this application.');
});
```

Và giờ hãy chạy thử để xem kết quả:

![Code after edited](https://i.imgur.com/S3g5ZMd.png "Edited code")

Goào, nó đã bắt được lỗi, ơ nhưng sao vẫn có đoạn "Seems like no problem with this application." được log ra?

Đấy là vì thằng try catch đã bắt lỗi, nên promise từ function main vẫn được fulfilled bình thường. Điều này có nghĩa là chúng ta đã "explicitly handle the error". Nếu bỏ try catch đi, hãy dùng "chain function", catch ngay sau khi call `main()` thì lỗi sẽ được log ra và không có thông báo thành công nào được in ra nữa (tự thử nhé).

### Quay lại vấn đề với Function đầu bài

Một lần nữa hãy ngắm lại function được đề cập ở phần trên bài viết và đưa ra nhận xét cũng như phân tích thêm. Chúng ta đã có được kiến thức nền cần thiết về Promise, từ thời điểm này hãy giả dụ nhưng chúng ta đều hiểu cách nó hoạt động rồi, cùng tiến hành nâng cấp nó lên nhé.

```typescript
function execute(args: SomeThing) {
	return new Promise((resolve, reject) => {
		callSomeAsyncStuffs(args).then(response => {
			const result = doSomeOtherThing(response);
			return result;
		}).catch(e => {
			reject(e);
		})
	})
}
```

Trước tiên, việc trả về một `new Promise` chỉ nên được thực hiện khi chúng ta hoàn toàn không thể biết được trả về của Promise ngoài cùng là khi nào. Ví dụ nhé, nếu bạn đang tạo 1 async function để thực hiện thao tác gọi tới 1 api, việc dùng `new Promise` sẽ là thừa thãi khi thực tế bạn chỉ cần trả luôn cái Promise được sinh ra từ việc gọi api là đủ rồi. Xem ví dụ như khi gọi tới 1 api bất kỳ chẳng hạn:

```typescript
const API_ENDPOINT = 'https://api.monokaijs.com/';
// Instead of writing this code
function badApproach() {
	return new Promise((resolve, reject) => {
		fetch(API_ENDPOINT, {
			body: 'naked=true'
		}).then(r => r.json()).then(response => {
			const data = response.some.property.that.should.exists;
			resolve(data);
		}).catch(e => {
			reject(e);
		})
	})
}
// Write this
function goodApproach() {
	return fetch(API_ENDPOINT, {
		body: 'naked=true'
	}).then(r => r.json()).then(response => response.some.property.that.should.exists);
	// no need to catch since we reject same error as throwned object
}
```

Cơ bản, thứ nhất, chúng ta không tạo thêm vấn đề để giải quyết (khi tạo thêm 1 promise, bạn phải nhớ thêm vấn đề, và tránh các lỗi promise), thứ hai, code gọn và mạch lạc hơn.

Phần catch, nếu xử lí gì về lỗi thì throw lại sau khi xử lí, còn nếu không thì cũng chả cần catch ở đoạn cuối làm gì.

Áp dụng vào đoạn code trên, chúng ta có thể sửa lại thành:

```typescript
function execute(args: SomeThing) {
	return callSomeAsyncStuffs(args).then(response => doSomeOtherThing(response));
}
```

Goắt đờ phắc, one liner luôn, thậm chí nó còn có thể viết thành như dưới đây:

```typescript
const execute = (args: SomeThing) => callSomeAsyncStuffs(args).then(r => doSomeOtherThings(r));
```

Ah shit, đây là cách mà các lập trình viên tránh phải chai mông bằng cách viết ít lại :=)

Vậy, khi nào phải trả về new Promise?

### new Promise, where, when and why?

Tới đây, chắc chắn sẽ có nhiều câu hỏi về việc tại sao chúng ta phải sử dụng new Promise làm gì, trong khi bản thân có thể dùng async await để giải quyết triệt để rồi. Thực chất thì async await được sinh ra cũng là để cái tiến cho thằng này, nên nếu anh em có thể tận dụng được nó thì tốt, nhưng dù sao trong 1 số trường hợp thì chúng ta vẫn phải sử dụng `new Promise` như thường. Hãy lấy ví dụ như bên dưới

```typescript
async function checkOldGirlFriends(profileId: string) {
	return new Promise((resolve, reject) => {
		getProfile(profileId).then((profile: Profile) => {
			const relationShipProfileId = profile.relationshipProfileId;
			getRelationshipProfile(relationShipProfileId).then((relationshipProfile: RelationshipProfile) => {
				const promises = relationshipProfile.girlfriends.filter(relationship => relationship.status === "BROKEN")
									.map(relationship => getProfile(relationship.partnerId));
				Promise.all(promises).then(profiles => {
					resolve(profiles);
				}).catch(e => {
					reject(new ApiError('Some error occurred while loading ex profiles'));
				});
			}).catch(e => {
        reject(new ApiError('User restricted their relationship info', 403));
			});
		}).catch((e: any) => {
			reject(new ApiError('Failed to get profile with code ' + e.code, 501));
		})
	});
}
```

Goèo, hãy coi độ phức tạp đi. Nếu viết lại try catch, sẽ có một số vấn đề này xảy ra:

- Có nhiều loại error cần được xử lí, có cái thì là ở load profile, có cái thì ở privacy. Nếu viết chung lại thì vẫn ok, nhưng sẽ gây khó cho dev khi có error xảy ra và nó là bug (kiểu như không biết lỗi ở đâu mà fix, và nó nằm ở context nào).
- Thứ hai, chúng ta không nên lồng nhiều try catch với nhau (vì khi throw ở cái này sẽ bị catch ở tầng bao bên ngoài).
- Đây chỉ là 1 ví dụ đơn giản, có nhiều hệ thống có các transactions phức tạp hơn, thì có thể sẽ phải xử lí căng thẳng hơn nữa.

Với những vấn đề trên, tôi cho rằng việc sử dụng Promise ở trong tình huống này sẽ là hợp lí, khi mà lỗi xảy ra một cách tương đối khó kiểm soát và nhiều loại hình lỗi khác nhau.

### Kết

Với bài viết tương đối dài này, tôi hy vọng có thể giúp cho anh em hiểu rõ hơn một chút về việc bắt lỗi như thế nào cũng như sự khác biệt giữa các contexts trong việc xử lí lỗi, hy vọng giúp được anh em trong việc cải thiện code. Trong thời gian tới, nếu có thể góp đủ thời gian, hy vọng sẽ có thể dành thêm nhiều thì giờ để gom các bài viết nho nhỏ chia sẻ kiến thức này thành một Series nâng cấp trình độ cho các anh em đang ở level intermediate trở xuống. Nếu trong bài viết có kiến thức nào chưa được chuẩn, hy vọng anh em có thể đóng góp :D



Thanks for reading. Cheers,

@monokaijs a.k.a @delimister
